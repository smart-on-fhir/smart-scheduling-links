#### For background and role definitions, see [README.md](./README.md)


# APIs hosted by _Provider Slot Server_

The goal of Slot Discovery APIs is to ensure that a high-volume Slot Discovery Client can keep up to date with open appointment slots. To this end, servers should be optimized to support the following client behaviors:

1. Client retrieves an updated list of `Schedule`, and `Location`, and appointment `Slot` data on a ~daily basis. This allows the client to assemble a database of slow-changing details (e.g., clinical services and locations), optimized for client-local database queries.

2. Client stays updated on appointment `Slot` changes throughout the day by checking for a list of `Slot`s every ~5 minutes (optionally including a `?_since={}`  parameter, which servers are free to ignore).

The client requests data calling [`GET /$bulk-publish`, which returns a FHIR Bulk Data Manifest](http://build.fhir.org/ig/HL7/bulk-data/branches/bulk-publish/bulk-publish.html) with links to NDJSON files. When following `output.url` links to retrieve published NDJSON files, clients can include an `If-None-Match` header, passing a previously obtained ETag value, to avoid downloading duplicate content (see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match).

*This API allows servers to provide a compliant implementation with static hosting only.*

#### Example manifest

For a service with base URL `https://example.com/covid-vaccines`, the following manifest might be returned:

```js
{

  // note this can be a static value -- time of last update
  "transactionTime": "2021-01-01T00:00:00Z",
  "request": "https://example.com/covid-vaccines/$bulk-publish",
  "output": [
    {
      "type": "Schedule",
      "url": "https://example.com/data/schedule_file_1.ndjson"
    },
    {
      "type": "Location",
      "url": "https://example.com/data/location_file_1.ndjson"
    },
    {
      "type": "Slot",
      "url": "https://example.com/data/slot_file_MA.ndjson"
    },
    {
      "type": "Slot",
      "url": "https://example.com/data/slot_file_CT.ndjson"
    }
  ],
  "error": []
}
```

## `Location` conveys a physical location

Each Location has at least:

* `name`
* `address` including a USPS [complete address](https://pe.usps.com/text/pub28/28c2_001.htm)

Optionally a Location can include:
* `position` with lat/long coordinates

##### Example `Location`

```json
{
  "resourceType": "Location",
  "id": "123",
  "name": "Flynn's Pharmacy in Pittsfield, MA",
  "description": "Located behind old Berkshire Bank building",
  "telecom": [{
    "system": "phone",
    "value": "413-000-0000"
  }],
  "address": {
    "line": ["173 Elm St"],
    "city": "Pittsfield",
    "state": "MA",
    "postalCode": "01201-7223"
  },
  "position": {
    "latitude": 42.444067,
    "longitude": -73.237613
  }
}
```

## `Schedule` conveys the calendar for a healthcare service at a physical location

Each `Schedule` has at least:

* `serviceType`, indicating what services are offered
* `actor` referencing a `Location` indicating where the service is provided (by street address and lat/lon)

##### Example `Schedule`

```json
{
  "resourceType": "Schedule",
  "id": "456",
  "serviceType": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/service-type",
          "code": "57",
          "display": "Immunization"
        },
        {
          "system": "http://fhir-registry.smarthealthit.org/CodeSystem/appointment-type",
          "code": "covid19-immunization",
          "display": "COVID-19 Immunization Appointment"
        }
      ]
    }
  ],
  "actor": [
    {
      "reference": "Location/123",
      "display": "Pharmacy ABC in Pittsfield, MA"
    }
  ]
}
```


## `Slot` conveys an available time window on a schedule

Each `Slot` has at least:

* `schedule` indicating the Schedule this slot belongs to
* `status` 
    * should be **`free`** or **`busy`**. Including busy slots ensures clients can be aware of total capacity.
* `start` time
*  `end` time
* "booking extension"
  * `extension.url` is `http://fhir-registry.smarthealthit.org/StructureDefinition/booking-deep-link`
  * `extension.valueUrl` a deep link into the Provider Booking Portal (see [below](#deep-links-hosted-by-provider-booking-portal))

##### Example `Slot`
```json
{
  "resourceType": "Slot",
  "id": "789",
  "schedule": {
    "reference": "Schedule/456"
  },
  "status": "free",
  "start": "2021-03-10T15:00:00-05",
  "start": "2021-03-10T15:20:00-05",
  "extension": [{
    "url": "http://fhir-registry.smarthealthit.org/StructureDefinition/booking-deep-link",
    "valueUrl": "https://ehr-portal.example.org/bookings?slot=opaque-slot-handle-89172489"
  }]
}
```

## Deep Links hosted by _Provider Booking Portal_

The Booking Portal is responsible for handling incoming deep links, according to the details below.

Each Slot exposed by the _Provider Slot Server_ includes an extension indicating the "booking-link", a URL that the Slot Discovery Client can redirect a user to, along with the following URL parameters:

* `source`: a correlation handle indicating the identity of the Slot Discovery Client, for use by the Provider Booking Portal in tracking the source of incoming referrals.
* `booking-referral`: a correlation handle for this specific booking referral. This parameter can optionally be retained by the Provider Booking Portal throughout the booking process, which can subsequently help the Slot Discovery Client to identify booked slots. (Details for this lookup are out of scope for this specification.)

##### Example

For the `Slot` example above, a client can construct the following URL to provide a deep link for a user to book a slot:

1. Parse the "booking-deep-link" `valueUrl`
2. Append `source` and `booking-referral`

In this case, if the `source` value is `source-abc` and the `booking-referral` is `34d1a803-cd6c-4420-9cf5-c5edcc533538`, then the fully constructed deep link URL would be:

    https://ehr-portal.example.org/bookings?slot=opaque-slot-handle-89172489&source=source-abc&booking-referral=34d1a803-cd6c-4420-9cf5-c5edcc533538

(Note: this construction is *not* as simple as just appending `&source=...` to the booking-deep-link, because the booking-deep-link may or may not already include URL parameters. The Slot Discovery Client must take care to parse the booking-deep-link and append parameters, e.g., including a `?` prefix if not already present.)
