Feature: Trade License Renewal
  As a licensed trader
  I want to renew my trade license annually
  So that I can continue operating legally under Ethiopian law

  Background:
    Given the Registration Building Block is running
    And the Information-Mediator-Client header is "ET/GOV/10000001/REGISTRATION"
    And I am authenticated as an applicant

  # ── Service Discovery ──────────────────────────────────────────────────

  Scenario: Discover the trade license renewal service
    When I request GET /api/v1/services
    Then the response contains a service with code "trade-license-renewal"
    And the service has an estimated processing time of 3 days

  # ── Fee Calculation ────────────────────────────────────────────────────

  Scenario: Grade 1 business pays base renewal fee
    Given I have a trade license renewal application with annual revenue 50000 ETB
    And the renewal date is before the Ethiopian fiscal year end
    When I submit the application
    Then the response status is 201
    And the calculated fee is 500 ETB

  Scenario: Grade 2 business pays higher renewal fee
    Given I have a trade license renewal application with annual revenue 150000 ETB
    And the renewal date is before the Ethiopian fiscal year end
    When I submit the application
    Then the response status is 201
    And the calculated fee is 1000 ETB

  Scenario: Grade 3 business pays highest renewal fee
    Given I have a trade license renewal application with annual revenue 600000 ETB
    And the renewal date is before the Ethiopian fiscal year end
    When I submit the application
    Then the response status is 201
    And the calculated fee is 2000 ETB

  Scenario: Late renewal incurs 10% penalty per 30-day period
    Given I have a Grade 1 trade license renewal application
    And the renewal date is 35 days after the Ethiopian fiscal year end
    When I submit the application
    Then the response status is 201
    And the calculated fee is 550 ETB (500 base + 10% late penalty)

  Scenario: Severely overdue renewal is automatically rejected
    Given I have a trade license renewal application
    And the renewal date is 7 months after the Ethiopian fiscal year end
    When I submit the application
    Then the response status is 422
    And the error details indicate the license is subject to cancellation

  # ── Determinant Rules ─────────────────────────────────────────────────

  Scenario: Address change triggers additional document requirement
    Given I have a trade license renewal with address_changed set to true
    When I submit the application
    Then the response status is 201
    And the required documents include "updated_lease_agreement"

  Scenario: Large employer requires labor clearance
    Given I have a trade license renewal with 60 employees
    When I submit the application
    Then the response status is 201
    And the required documents include "labor_clearance_certificate"

  Scenario: Small employer does not require labor clearance
    Given I have a trade license renewal with 15 employees
    When I submit the application
    Then the response status is 201
    And the required documents do not include "labor_clearance_certificate"

  # ── Workflow Lifecycle ────────────────────────────────────────────────

  Scenario: License officer approves renewal
    Given there is a SUBMITTED trade license renewal application
    And I am authenticated as a "license-officer" operator
    When I complete the license-review task with decision "APPROVED"
    Then the application status becomes "APPROVED"
    And a payment record is created
