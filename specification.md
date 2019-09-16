#### For background and role definitions, see [README.md](./README.md)

## APIs hosted by _Provider Slot Server_

The goal of Slot Search APIs is to ensure that a high-volume Appointment Search Client can keep up to date with slots and availability. To this end, servers should be optimzied to support the following client behaviors:

1. Client retrieves an updated list of `Schedule`, `Slot, and `Location` data on a ~daily basis. This allows the client to assemble a databse of clinical services, optimized for location-based lookup.

2. Client stays updated on `Slot` availability throughout the day by polling for an updated list of `Slot` every ~1-5 minutes, issuing a `?_lastUpdated` query. This allows a Slot Server to maintain cached responses of recently booked slots as a performance optimization (i.e., slots where the status has changed from `free` -> something else). (*Note: Subscriptions could be used in place of polling, as a future enhancement -- but the specification is designed to work even with polling.*)

#### `GET /Schedule` to find relevant services/providers
Search parameters that a server must support:
* `serviceCategory`
* `serviceType`

Each `Schedule` has at least:

* a `serviceCategory` and `serviceType`, indicating what services are offered
* an `actor` referencing a `Location` indicating where the service is provided (by street address and lat/lon)
* an `actor` referencing a `HealthcareService` indicating the organization that is providing the services
* (optionally) an `actor` referencing a `Practitioner` or `PractitionerRole` indicating the individual providing the service

#### `GET /Slot` to find available slots

Search parameters that a server must support:
* `status=`
* `start=gt{{instant}}`
* `_sort=start`

Each `Slot` has at least:

* a `schedule` indicating the Schedule that this slot belongs to
* a `status` (for bookable slots: `free`)
* an `appointmentType` drawn from the [preferred code system](http://build.fhir.org/v2/0276/index.html)
* a `start` time
* an `end` time
* a "booking extension"
  * `extension.url` is `http://argonautproject.org/smart-scheduling/Extension/booking-deep-link`
  * `extension.valueUrl` a deep link into  the Provider Booking Portal (see [below](#deep-links-hosted-by-provider-booking-portal))

For example, it's possible to search for all available slots over the upcoming month (in the example: June 2020), which an Appointment Search Client might do once at the beginning of the month:

    GET /Slot?start=2020-06
    
Then, it't possible for to search for all recently updated slots. For example, the client might issue a query every five minutes for changes that have occurred during the past ten minutes of changes (i.e., using overlapping time windows to ensure no data are missed):

    GET /Slot?_lastUpdate=gt2020-06-03T19:10:00.000Z


#### `GET /Location` to retrieve all locations
#### `GET /Location/:id` to retrieve a specific location

Each Location has at least:

* `name`
* `address` including a USPS [complete address](https://pe.usps.com/text/pub28/28c2_001.htm) and lat/long coordinates

## Deep Links hosted by _Provider Booking Portal_

The Booking Portal is responsible for handling incoming deep links, according to the details below.

Each Slot exposed by the _Provider Slot Server_ includes an extension indicating the "booking-link", a URL that the Appointment Search Client can redirect a user to, along with the following URL parameters:

* `source`: a correlation handle indicating the identity of the Appointment Search Client, for use by the Provider Booking Portal in tracking the source of incoming referrals.
* `booking-referral`: a correlation handle for this specific booking referral. This parameter can optionally be retained by the Provider Booking Portal throughout the booking process, which can subsequently help the Appointment Search Client to identify booked slots. (Details for this lookup are out of scope for this specification.)

##### Example

For example, if the Appointment Search Client discovers a `Slot` like:

```json
{
  "resourceType": "Slot",
  "id": "182791212",
  "schedule": {
    "reference": "Schedule/123"
  },
  "status": "free",
  "appointmentType": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v2-0276",
      "code": "ROUTINE"
    }]
  },
  "start": "2020-06-10T15:00:00.000Z",
  "start": "2020-06-10T15:20:00.000Z",
  "extension": [{
    "url": "http://argonautproject.org/smart-scheduling/Extension/booking-deep-link",
    "valueUrl": "https://ehr-portal.example.org/bookings?slot=opaque-slot-handle-89172489"
  }]
  
}
```

It can construct the following URL to provide a deep link for a user to book a slot:

1. Parse the "booking-deep-link" `valueUrl`
2. Append `schedule` and `booking-referral`

In this case, if the `source` value is `source-abc` and the `booking-referral` is `34d1a803-cd6c-4420-9cf5-c5edcc533538`, then the fully constructed deep link URL would be:

    https://ehr-portal.example.org/bookings?slot=opaque-slot-handle-89172489&source=source-abc&booking-referral=34d1a803-cd6c-4420-9cf5-c5edcc533538

(Note: this construction is *not* as simple as just appending `&source=...` to the booking-deep-link, because the booking-deep-link may or may not already include URL parameters. The Appointment Search Client must take care to parse the booking-deep-link and append parameters, e.g., including a `?` prefix if not already present.)
