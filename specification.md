## For background and role definitions, see [README.md](./README.md)

## APIs hosted by _Provider Slot Server_

### `GET /HealthcareService` to find service caterogies offered at an organization
Each `Healthcareservice` should have:

* a `type` specifying the broad
* an associated `Location` that includes street address and optionally latitude/longitude
* an associated `Schedule` representing 

List of HealthcareServices (i.e., each HealthcareService represents a category of services provided by a given organization at a given location, like "Primary Care from SwedishAmerican at their Roscoe, IL clinic"). 
Each HealthcareService should have an associated Location including lat/lon + address information
Each HealthcareService should have an associated Schedule representing the collection of appointment slots
List of Slots for each Schedule, each including a start/end time, and a busy/free status

 
