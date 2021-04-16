# Publisher Advertising

This document provides simple guidance as to how _slot publishers_ can advertise their endpoints in order to facilitate discovery by clients.
In brief, we recommend publisher make use of two specific approaches:
1. Adding an additional `json` description of their endpoint to this repository.
1. Including a [schema.org service](https://schema.org/Service) description on their home page.

## Centralized repository

Organizations are encouraged to publish their endpoints by submitting an entry in the [publisher-repository](/publisher-repository) directory of this repo, which includes the following information:

| field name | type | required | description |
| --- | --- | --- | ---|
| `name` | string | true | Name of publisher endpoint (e.g. SMART Clinic, Boston) |
| `organization` | string | true | Name of organization publishing information (e.g. SMART Health) |
| `synthetic` | boolean | true | Whether or not the endpoint is hosting synthetic data instead of production data |
| `baseURL` | string | string | Base URL where clients can find the publish manifest and NDJSON files (should not include `$bulk-publish`) |
| `contacts` | array of JSON objects | true | At least one point of contact for addressing questions or issues with the endpoint |
| `headers` | array of JSON objects | false | An optional list of header key/values that must be included in requests |
| `params` | array of JSON objects | false | An optional list of query parameter key/values that must be included in requests |

Contact information should follow the given format:

| field name | type | required | description |
| --- | --- | --- | ---|
| `name` | string | true | Name of contact |
| `email` | string | true | Email address of contact |

Header and Query param information should have the following format:

| field name | type | required | description |
| --- | --- | --- | ---|
| `name` | string | true | Name of required header/parameter |
| `email` | string true | value of required header/parameter |

An example is given below:

```json
{
  "name": "SMART Slot Publisher Specification Repository",
  "organization": "SMART",
  "synthetic": true,
  "baseURL": "https://raw.githubusercontent.com/smart-on-fhir/smart-scheduling-links/master/examples",
  "contacts": [
    {
      "name": "Nick Robison",
      "email": "nicholas.a.robison@omb.eop.gov"
    },
    {
      "name": "Josh Mandel",
      "email": "jmandel@gmail.com"
    }
  ],
  "headers": [
    {
      "name": "CLIENT_ID",
      "value": "test-client-id"
    }
  ],
  "params": [
    {
      "name": "clientid",
      "value": "test-client-id"
    }
  ]
}
```

### Submitting an endpoint to the repository

Endpoint submission is handled through Github Pull Requests (PR).
Each PR will be reviewed by project administrators to ensure upstream data is correct and from an authentic publisher.

Users may submit a PR by the following process:

1. Create a [Fork](https://github.com/smart-on-fhir/smart-scheduling-links/fork) of the repository in order to make changes.
1. Create a new `.json` file in the [publisher-repository](/publisher-repository) directory.
   
    A JSON schema file is [provided](bin/upstream-validator/schema.json) which can facilitate data creation.
1. Fill out the required information in the format given above.
1. Push changes to your fork
1. Create a [pull request](https://github.com/smart-on-fhir/smart-scheduling-links/compare) against the repository.

    Please include descriptive information that will allow the project administrators to verify the authenticity of the data and the request.
    Administrators may request additional information and/or verification before accepting the proposed addition. 

## Schema.org definition

Organizations may choose to publish their endpoints by including an additional _schema.org_ `Service` description to their home page.
A sample service definition is included below:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Service",
  "provider": {
    "@type": "Organization",
    "name": "Carbon Health"
  },
  "serviceType": "https://github.com/smart-on-fhir/smart-scheduling-links",
  "url": "https://api.carbonhealth.com/hib/publicVaccination/$bulk-publish"
}
</script>
```

The key fields are as follows:
- `serviceType` - _MUST_ be `https://github.com/smart-on-fhir/smart-scheduling-links`.
- `url` - _MUST_ point to the `$bulk-publish` endpoint of the upstream publisher.

Publishers are encouraged to add their endpoint information to the GitHub repository, in addition to publishing via JSON schema.
Additional information (such as update frequency) may be communicated via the schema definitions as well.
