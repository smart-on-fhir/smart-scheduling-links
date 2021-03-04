import example from './example-availability.json';
import hash from 'hash.js';

/* Given a set of "Availability Spec" formatted locations, create SMART Scheduling Links data
 * - Locations
 * - Schedules
 * - Slots
 */

interface Resource {
  resourceType: string;
  id: string;
  [key: string]: unknown;
}

interface ConversionContext {
  openTime: string;
  closeTime: string;
}

interface ConversionResult {
  locations: Resource[];
  schedules: Resource[];
  slots: Resource[];
}

const URLs = {
  bookingLink: 'http://fhir-registry.smarthealthit.org/StructureDefinition/booking-deep-link',
  bookingPhone: 'http://fhir-registry.smarthealthit.org/StructureDefinition/booking-phone',
  slotCapacity: 'http://fhir-registry.smarthealthit.org/StructureDefinition/slot-capacity',
  serviceTypeDetailed: 'http://fhir-registry.smarthealthit.org/CodeSystem/service-type',
  serviceType: 'http://terminology.hl7.org/CodeSystem/service-type',
  vtrcks: 'https://cdc.gov/vaccines/programs/vtrcks',
};

const convertLocation = (inputLocation: typeof example[number], context: ConversionContext): ConversionResult => {
  // In this conversion function, we'll take street address as fully representing a location
  // so we create a synthetic Location.id that's just a hash of the address. This is
  // stable and easy to work with, but in a real system you'd probably have a
  // "proper" (managed, stable, unique) id for your locations.

  const address = {
    line: [inputLocation.location.street, inputLocation.location.street_line_2].filter((l) => l !== undefined),
    city: inputLocation.location.city,
    state: inputLocation.location.state,
    postalCode: inputLocation.location.zipcode,
    district: inputLocation.location.county,
  };

  const location = {
    resourceType: 'Location',
    id: hash.sha256().update(JSON.stringify(address)).digest('hex').slice(0, 32),
    name: inputLocation.name,
    telecom: [
      { system: 'phone', value: inputLocation.contact.info_phone },
      { system: 'url', value: inputLocation.contact.info_url },
    ],
    address,
    identifier: [{ system: URLs.vtrcks, value: inputLocation.id }],
  };

  const schedule = {
    resourceType: 'Schedule',
    id: `c19-${location.id}`,
    serviceType: [
      {
        coding: [
          { system: URLs.serviceType, code: '57', display: 'Immunization' },
          {
            system: URLs.serviceTypeDetailed,
            code: 'covid19-immunization',
            display: 'COVID-19 Immunization Appointment',
          },
        ],
      },
    ],
    actor: [{ reference: `Location/${location.id}` }],
  };

  const slots = inputLocation.availability.flatMap((availDay) => {
    const slotShape = {
      resourceType: 'Slot',
      id: `c19-${location.id}-${availDay.date}`,
      schedule: {
        reference: `Schedule/${schedule.id}`,
      },
      start: `${availDay.date}T${context.openTime}`,
      end: `${availDay.date}T${context.closeTime}`,
    };

    return [
      {
        ...slotShape,
        id: `${slotShape.id}f`,
        status: 'free',
        extension: [
          { url: URLs.bookingLink, valueUrl: inputLocation.contact.booking_url },
          { url: URLs.bookingPhone, valueString: inputLocation.contact.booking_phone },
          { url: URLs.slotCapacity, valueInteger: availDay.available_slots },
        ],
      },
      {
        ...slotShape,
        id: `${slotShape.id}b`,
        status: 'busy',
        extension: [{ url: URLs.slotCapacity, valueInteger: availDay.total_slots - availDay.available_slots }],
      },
    ];
  });

  return { locations: [location], schedules: [schedule], slots };
};

// Run the conversion function on all locations from example file
const converted = example.map((e) => convertLocation(e, { openTime: '09:00:00-05:00', closeTime: '17:00:00-05:00' }));

(['locations', 'schedules', 'slots'] as const).forEach((f) => {
  console.log(`\n## ${f}`);
  console.log(
    converted
      .flatMap((r) => r[f])
      .map((i) => '    ' + JSON.stringify(i))
      .join('\n'),
  );
});
