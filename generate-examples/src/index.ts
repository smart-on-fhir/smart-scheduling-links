/* eslint-disable @typescript-eslint/no-explicit-any */
import { Command } from 'commander';
import fs from 'fs';
import _ from 'lodash';

const BASE_URL = 'https://raw.githubusercontent.com/smart-on-fhir/smart-scheduling-links/master/examples/';

const COARSE_GRAINED_SLOTS = true;

const VISIT_MINUTES = 20;

const OPENING_TIME = 'T09:00-05:00';
const CLOSTING_TIME = 'T18:00-05:00';
const SLOT_CAPACITY = 100;

let _resourceId = 0;
const resourceId = () => '' + _resourceId++;

let _bookingId = 1000000;
const bookingId = () => '' + _bookingId++;

const openingTime = (date: string): string => {
  return new Date(date.slice(0, 10) + OPENING_TIME).toISOString();
};

const closingTime = (date: string): string => {
  return new Date(date.slice(0, 10) + CLOSTING_TIME).toISOString();
};

const getWeek = function (d: Date) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

const slot = (start: string, end: string, schedule: Resource) => ({
  resourceType: 'Slot',
  id: resourceId(),
  schedule: {
    reference: `Schedule/${schedule.id}`,
  },
  status: 'free',
  start: COARSE_GRAINED_SLOTS ? openingTime(start) : start,
  end: COARSE_GRAINED_SLOTS ? closingTime(end) : end,

  extension: [
    {
      url: 'http://fhir-registry.smarthealthit.org/StructureDefinition/booking-deep-link',
      valueUrl: `https://ehr-portal.example.org/bookings?slot=${bookingId()}`,
    },
    {
      url: 'http://fhir-registry.smarthealthit.org/StructureDefinition/booking-phone',
      valueString: `000-000-0000`,
    },
    ...(COARSE_GRAINED_SLOTS
      ? [
          {
            url: 'http://fhir-registry.smarthealthit.org/StructureDefinition/slot-capacity',
            valueInteger: SLOT_CAPACITY,
          },
        ]
      : []),
  ],
});

const schedule = (location: Resource) => ({
  resourceType: 'Schedule',
  id: resourceId(),
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
  extension: [
    {
      url: 'http://fhir-registry.smarthealthit.org/StructureDefinition/vaccine-dose',
      valueInteger: 1
    },
    {
      url: 'http://fhir-registry.smarthealthit.org/StructureDefinition/vaccine-product',
      valueCoding: {
        system: 'http://hl7.org/fhir/sid/cvx',
        code: '207',
        display: 'Moderna COVID-19 Vaccine',
      }
    }
  ],
});

interface Resource {
  resourceType: string;
  id: string;
  [key: string]: any;
}
const locations: Resource[] = [
  {
    resourceType: 'Location',
    id: resourceId(),
    name: 'SMART Vaccine Clinic Boston',
    telecom: [
      {
        system: 'phone',
        value: '000-000-0000',
      },
      {
        system: 'url',
        value: 'https://pharmacy.example.com/location/00',
      },
    ],
    address: {
      line: ['123 Summer St'],
      city: 'Boston',
      state: 'MA',
      postalCode: '02114',
      district: 'Suffolk',
    },
    identifier: [
      {
        system: 'https://cdc.gov/vaccines/programs/vtrcks',
        value: 'fake-vtrcks-pin-00',
      },
    ],
  },
  {
    resourceType: 'Location',
    id: resourceId(),
    name: 'SMART Vaccine Clinic Worcester',
    telecom: [
      {
        system: 'phone',
        value: '000-000-0000',
      },
      {
        system: 'url',
        value: 'https://pharmacy.example.com/location/01',
      },
    ],
    address: {
      line: ['123 West St'],
      city: 'Worcester',
      state: 'MA',
      postalCode: '01602',
      district: 'Worcester',
    },
    identifier: [
      {
        system: 'https://cdc.gov/vaccines/programs/vtrcks',
        value: 'fake-vtrcks-pin-01',
      },
    ],
  },
  {
    resourceType: 'Location',
    id: resourceId(),
    name: 'SMART Vaccine Clinic Springfield',
    telecom: [
      {
        system: 'phone',
        value: '000-000-0000',
      },
      {
        system: 'url',
        value: 'https://pharmacy.example.com/location/02',
      },
    ],
    address: {
      line: ['123 Ash St'],
      city: 'Springfield',
      state: 'MA',
      postalCode: '01101',
      district: 'Hampden',
    },
    identifier: [
      {
        system: 'https://cdc.gov/vaccines/programs/vtrcks',
        value: 'fake-vtrcks-pin-02',
      },
    ],
  },
  {
    resourceType: 'Location',
    id: resourceId(),
    name: 'SMART Vaccine Clinic Cambridge',
    telecom: [
      {
        system: 'phone',
        value: '000-000-0000',
      },
      {
        system: 'url',
        value: 'https://pharmacy.example.com/location/03',
      },
    ],
    address: {
      line: ['123 Arrow St'],
      city: 'Cambridge',
      state: 'MA',
      postalCode: '02139',
      district: 'Middlesex',
    },
    identifier: [
      {
        system: 'https://cdc.gov/vaccines/programs/vtrcks',
        value: 'fake-vtrcks-pin-03',
      },
    ],
  },
  {
    resourceType: 'Location',
    id: resourceId(),
    name: 'SMART Vaccine Clinic Lowell',
    telecom: [
      {
        system: 'phone',
        value: '000-000-0000',
      },
      {
        system: 'url',
        value: 'https://pharmacy.example.com/location/04',
      },
    ],
    address: {
      line: ['123 Peach St'],
      city: 'Lowell',
      state: 'MA',
      postalCode: '01851',
      district: 'Middlesex',
    },
    identifier: [
      {
        system: 'https://cdc.gov/vaccines/programs/vtrcks',
        value: 'fake-vtrcks-pin-04',
      },
    ],
  },
  {
    resourceType: 'Location',
    id: resourceId(),
    name: 'SMART Vaccine Clinic Brockton',
    telecom: [
      {
        system: 'phone',
        value: '000-000-0000',
      },
      {
        system: 'url',
        value: 'https://pharmacy.example.com/location/05',
      },
    ],
    address: {
      line: ['123 Oak St'],
      city: 'Brockton',
      state: 'MA',
      postalCode: '02301',
      district: 'Suffolk',
    },
    identifier: [
      {
        system: 'https://cdc.gov/vaccines/programs/vtrcks',
        value: 'fake-vtrcks-pin-05',
      },
    ],
  },
  {
    resourceType: 'Location',
    id: resourceId(),
    name: 'SMART Vaccine Clinic New Bedford',
    telecom: [
      {
        system: 'phone',
        value: '000-000-0000',
      },
      {
        system: 'url',
        value: 'https://pharmacy.example.com/location/06',
      },
    ],
    address: {
      line: ['123 Cyprus St'],
      city: 'New Bedford',
      state: 'MA',
      postalCode: '02740',
      district: 'Bristol',
    },
    identifier: [
      {
        system: 'https://cdc.gov/vaccines/programs/vtrcks',
        value: 'fake-vtrcks-pin-06',
      },
    ],
  },
  {
    resourceType: 'Location',
    id: resourceId(),
    name: 'SMART Vaccine Clinic Lynn',
    telecom: [
      {
        system: 'phone',
        value: '000-000-0000',
      },
      {
        system: 'url',
        value: 'https://pharmacy.example.com/location/07',
      },
    ],
    address: {
      line: ['123 Cherry St'],
      city: 'Lynn',
      state: 'MA',
      postalCode: '01901',
      district: 'Essex',
    },
    identifier: [
      {
        system: 'https://cdc.gov/vaccines/programs/vtrcks',
        value: 'fake-vtrcks-pin-07',
      },
    ],
  },
  {
    resourceType: 'Location',
    id: resourceId(),
    name: 'SMART Vaccine Clinic Quincy',
    telecom: [
      {
        system: 'phone',
        value: '000-000-0000',
      },
      {
        system: 'url',
        value: 'https://pharmacy.example.com/location/08',
      },
    ],
    address: {
      line: ['123 Cranberry St'],
      city: 'Quincy',
      state: 'MA',
      postalCode: '02269',
      district: 'Norfolk',
    },
    identifier: [
      {
        system: 'https://cdc.gov/vaccines/programs/vtrcks',
        value: 'fake-vtrcks-pin-08',
      },
    ],
  },
  {
    resourceType: 'Location',
    id: resourceId(),
    name: 'SMART Vaccine Clinic Pittsfield',
    telecom: [
      {
        system: 'phone',
        value: '000-000-0000',
      },
      {
        system: 'url',
        value: 'https://pharmacy.example.com/location/09',
      },
    ],
    address: {
      line: ['123 Elm St'],
      city: 'Pittsfield',
      state: 'MA',
      postalCode: '01201',
      district: 'Berkshire'
    },
    identifier: [
      {
        system: 'https://cdc.gov/vaccines/programs/vtrcks',
        value: 'fake-vtrcks-pin-09',
      },
    ],
  },
];

const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(new Date(date).setMinutes(date.getMinutes() + minutes));
};

const createResources = () => {
  const startDate = new Date('2021-03-01T00:00-05:00');
  const endDate = new Date('2021-03-31');
  const currentDate = new Date(startDate);

  const schedules = locations.map((l) => schedule(l));
  let slots: Resource[] = [];

  while (currentDate <= endDate) {
    const clinicOpenTime = addMinutes(currentDate, 8 * 60);
    const slotsForSchedules = schedules.flatMap((schedule) => {
      const ret: Resource[] = [];
      for (let i = 0; i < 30; i++) {
        const startTime = addMinutes(clinicOpenTime, i * VISIT_MINUTES);
        const endTime = addMinutes(startTime, VISIT_MINUTES);
        ret.push(slot(startTime.toISOString(), endTime.toISOString(), schedule));
        if (COARSE_GRAINED_SLOTS) break;
      }
      return ret;
    });
    slots = [...slots, ...slotsForSchedules];
    currentDate.setDate(currentDate.getDate() + 1);
  }
  const manifest = {
    transactionTime: new Date().toISOString(),
    request: `${BASE_URL}$bulk-publish`,
    output: [
      {
        type: 'Location',
        url: `${BASE_URL}locations.ndjson`,
      },
      {
        type: 'Schedule',
        url: `${BASE_URL}schedules.ndjson`,
      },
    ],
    error: [],
  };
  return {
    manifest,
    locations,
    slots,
    schedules,
  };
};

async function generate(options: { outdir: string }) {
  const resources = createResources();
  const fileLocation = `locations.ndjson`;
  const fileSchedule = `schedules.ndjson`;
  const fileSlot = (i: string) => `slots-${i}.ndjson`;
  const fileManifest = `$bulk-publish`;

  fs.writeFileSync(`${options.outdir}/${fileLocation}`, resources.locations.map((s) => JSON.stringify(s)).join('\n'));
  fs.writeFileSync(`${options.outdir}/${fileSchedule}`, resources.schedules.map((s) => JSON.stringify(s)).join('\n'));

  const slotsSplitMap = _.chain((resources.slots as unknown) as { start: string }[])
    .groupBy((s) => s.start.slice(0, 4) + '-W' + String(getWeek(new Date(s.start))).padStart(2, '0'))
    .value();

  Object.entries(slotsSplitMap).forEach(([week, slots]) => {
    fs.writeFileSync(`${options.outdir}/${fileSlot(week)}`, slots.map((s) => JSON.stringify(s)).join('\n'));
  });

  resources.manifest.output = [
    ...resources.manifest.output,
    ...Object.entries(slotsSplitMap).map(([week]) => ({
      type: 'Slot',
      url: `${BASE_URL}${fileSlot(week)}`,
      extension: {
        state: ['MA'],
      },
    })),
  ];

  fs.writeFileSync(`${options.outdir}/${fileManifest}`, JSON.stringify(resources.manifest, null, 2));
}

const program = new Command();
program.option('-o, --outdir <outdir>', 'output directory');
program.parse(process.argv);

interface Options {
  outdir: string;
}

const options = program.opts() as Options;
console.log('Opts', options);

if (options.outdir) {
  generate(options);
}
