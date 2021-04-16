# SMART Scheduling Links
*What if booking clinical appointments looked more like booking airline tickets?*

* See [specification.md](specification.md) for API requirements and details
* See [publisher-advertising.md](publisher-advertising.md) for information on publicising bulk publisher endpoints.
* Chat with us at [#smart/scheduling-links on chat.fhir.org](https://chat.fhir.org/#narrow/stream/281612-smart.2Fscheduling-links)

|Status|
|---|
|Draft proposal for discussion|


## Lightweight, scalable appointment booking API

"SMART Scheduling Links" is a standards-based specification enabling patients to:

1. **find appointment slots** using an appointment booking tool of their choice, searching by geography, specialty, health system, etc
2. **follow a deep link** into the provider's booking portal, to book a specific slot
3. **complete a booking**, e.g., by providing details, answering questions, or submitting referral documentation

We are parsimonious in our use of standards, so that:

* step 1 is standardized with **FHIR Slot Discovery**; then 
* step 2 is standardized with **HTTPS deep-linking conventions**; meanwhile
* step 3 **requires no standardization**, enabling flexible and provider-specific rules to govern the completion of the booking process.
(To be clear, many standards can facilitate step 3, but they're out of scope for SMART Scheduling Links.)

## Roles and responsibilities

This specification defines three functional roles:

* **Slot Discovery Client**: the booking tool of a patient's choice. This system discovers appointment slots on a patient's behalf, and helps the patient choose the best slots to book (e.g., by evaluating trade-offs of travel distance or wait time).

* **Slot Publisher**: the API service offered by a healthcare provider, advertising available slots. Critically, advertising a slot should be low-risk, since the mere fact that a slot is advertised does *not* guarantee that any given patient will be allowed to book the slot; instead, sophisticated rules can be implemented by the...

* **Provider Booking Portal**: the UI service offered by a healthcare provider, enabling a user to book a selected slot. This is the place where provider-specific rules can be implemented, e.g. to ensure that patients booking a specialty appointment are appropriate candidates for that specialist's care. (In many implementations, this UI will be housed within a general-purpose provider-hosted patient portal.)

## Is the UX good enough?

Examining the SMART Scheduling Links workflow described above, there are some potential user-experience challenges:

* After the hand-off from a Slot Discovery Client into a healthcare provider's system, the user might have to sign
into the healthcare provider's system, or create a new account; and might have to answer all sorts of
provider-specific questions in order to complete a booking.

* Appointment slot data might become stale, so that by the time a patient signs into the provider's system, the slot is already taken.
   
* Once an appointment booking is completed, the Slot Discovery Client might not have an easy way to learn about
the details of the booking (e.g., was it successful; what is the specific location and timing).

In other words, compared with a deeply-integrated scheduling paradigm where a booking tool could guide the user through every step of the process, SMART Scheduling Links provides a more loosely-coupled user experience. But we have strong evidence that this is a viable UX trade-off, because it works just like a very familiar and highly successful booking system...

## Analogy: airline booking

Cross-industry standards analogies can sometimes be misleading -- but to build up an intuition, it's worth comparing the SMART Scheduling Links workflow with the consumer airline booking experience. Briefly: the Slot Discovery Client plays the same role as a travel booking tool like KAYAK or Hipmunk. These systems help their users search for relevant options across multiple service providers, and help users evaluate trade-offs among these options. Once the user makes a selection, a deep link takes them to a service provider to complete the workflow. The Provider Booking Portal plays the same role as an airline like United or Delta. These systems manage user accounts and enable a booking-completion workflow. They also serve as gatekeepers, e.g. to collect data about a user's background as well as identifiers such as a Known Traveler Number or redress number. They can "call off" the workflow at any point (e.g., if a user is unable to provide the required information, or if a previously-available slot has been booked by another user).

This pattern works well in airline booking, and could dramatically reduce the difficulty of healthcare appointment booking.

## Haven't we tried this before? (Argonaut Scheduling 2017)

The [2017 Argonaut Scheduling IG](https://www.fhir.org/guides/argonaut/scheduling/) provides detailed specifications for scheduling appointments, but has not seen broad adoption. That specification defines a deep integration pattern where a third-party client can create new `Patient` resources within a server and can fully book an appointment slot for its users. There are two key challenges that have limited adoption of this IG:

1. A strong degree of trust is required between the third-party app and the EHR system, since the app is allowed to directly manipulate the state of the EHR.

2. Providers have no way to set rules/expectations about which patients are good candidates for a given slot -- which means that specialists are unwilling to open up scheduling. The issues is that, for example, a neuromuscular specialist needs to ensure that her patients actually have a relevant diagnosis and have been through suitable pre-specialty workup. The relevant questions and up-front data-gathering are highly specialized, and deep integration of scheduling provides no way to collect and assess these details before booking a slot.

## Moving ahead!

SMART Scheduling Links provides a lightweight complement to the 2017 Argonaut Scheduling IG. It addresses real-world adoption challenges by providing a simple, familiar user experience -- with a very small standards footprint.
