import example from './example-availability.json';
import hash from 'hash.js';

const EXAMPLE_OPEN_TIME = '09:00:00-5';
const EXAMPLE_CLOSE_TIME = '17:00:00-5';

interface Resource {
  resourceType: string;
  id: string;
  [key: string]: unknown;
}

interface ConversionResult {
  locations: Resource[];
  schedules: Resource[];
  slots: Resource[];
}

const convertLocation = (inputLocation: typeof example): ConversionResult => {
  const address = {
    line: [inputLocation.location.street, inputLocation.location.street_line_2].filter((l) => l !== undefined),
    city: inputLocation.location.city,
    state: inputLocation.location.state,
    postalCode: inputLocation.location.zipcode,
    district: inputLocation.location.county,
  };

  const location = {
    resourceType: 'Location',
    id: hash.sha256().update(JSON.stringify(address)).digest('hex').slice(16),
    name: inputLocation.name,
    telecom: [
      {
        system: 'phone',
        value: inputLocation.contact.info_phone,
      },
      {
        system: 'url',
        value: inputLocation.contact.info_url,
      },
    ],
    address,
    managingOrganization: {
      identifier: {
        system: 'https://cdc.gov/vaccines/programs/vtrcks',
        value: inputLocation.id,
      },
    },
  };

  const schedule = {
    resourceType: 'Schedule',
    id: `c19-${location.id}`,
    serviceType: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/service-type',
            code: '57',
            display: 'Immunization',
          },
          {
            system: 'http://fhir-registry.smarthealthit.org/CodeSystem/service-type',
            code: 'covid19-immunization',
            display: 'COVID-19 Immunization Appointment',
          },
        ],
      },
    ],
    actor: [
      {
        reference: `Location/${location.id}`,
      },
    ],
  };

  const slots = inputLocation.availability.flatMap((availDay) => {
    const slotShape = {
      resourceType: 'Slot',
      id: `c19-${location.id}-${availDay.date}`,
      schedule: {
        reference: `Schedule/${schedule.id}`,
      },
      start: `${availDay.date}T${EXAMPLE_OPEN_TIME}`,
      end: `${availDay.date}T${EXAMPLE_CLOSE_TIME}`,
    };

    return [
      {
        ...slotShape,
        id: `c19-${location.id}-${availDay.date}f`,
        status: 'free',
        extension: [
          {
            url: 'http://fhir-registry.smarthealthit.org/StructureDefinition/booking-deep-link',
            valueUrl: inputLocation.contact.booking_url,
          },
          {
            url: 'http://fhir-registry.smarthealthit.org/StructureDefinition/booking-phone',
            valueUrl: inputLocation.contact.booking_phone,
          },
          {
            url: 'http://fhir-registry.smarthealthit.org/StructureDefinition/slot-capacity',
            valueInteger: availDay.available_slots,
          },
        ],
      },
      {
        ...slotShape,
        id: `c19-${location.id}-${availDay.date}b`,
        status: 'busy',
        extension: [
          {
            url: 'http://fhir-registry.smarthealthit.org/StructureDefinition/slot-capacity',
            valueInteger: availDay.total_slots - availDay.available_slots,
          },
        ],
      },
    ];
  });

  return {
    locations: [location],
    schedules: [schedule],
    slots,
  };
};

const converted = convertLocation(example);
console.log('\n## Locations');
console.log(converted.locations.map((i) => '    ' + JSON.stringify(i)).join('\n'));
console.log('\n## Schedules');
console.log(converted.schedules.map((i) => '    ' + JSON.stringify(i)).join('\n'));
console.log('\n## Slots');
console.log(converted.slots.map((i) => '    ' + JSON.stringify(i)).join('\n'));
