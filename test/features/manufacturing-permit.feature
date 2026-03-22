Feature: Manufacturing Permit
  As a manufacturing business owner
  I want to obtain a manufacturing permit
  So that I can legally operate a manufacturing facility in Ethiopia

  Background:
    Given the Registration Building Block is running
    And the Information-Mediator-Client header is "ET/GOV/10000001/REGISTRATION"
    And I am authenticated as an applicant

  # ── ESIA Requirements ─────────────────────────────────────────────────

  Scenario: Category A manufacturing requires full ESIA
    Given I have a manufacturing permit application with esia_category "A"
    When I submit the application
    Then the response status is 201
    And the required documents include "esia_full_assessment_report"
    And the required documents include "public_consultation_report"
    And the calculated ESIA fee is 50000 ETB

  Scenario: Category B manufacturing requires limited ESIA
    Given I have a manufacturing permit application with esia_category "B"
    When I submit the application
    Then the response status is 201
    And the required documents include "esia_limited_assessment_report"
    And the required documents do not include "public_consultation_report"
    And the calculated ESIA fee is 15000 ETB

  Scenario: Category C manufacturing has no ESIA requirement
    Given I have a manufacturing permit application with esia_category "C"
    When I submit the application
    Then the response status is 201
    And the required documents do not include "esia_full_assessment_report"
    And the required documents do not include "esia_limited_assessment_report"
    And the calculated ESIA fee is 5000 ETB

  # ── Sector-Specific Rules ─────────────────────────────────────────────

  Scenario: Food processing requires EFDA manufacturing license
    Given I have a manufacturing permit application with sector "food_processing"
    When I submit the application
    Then the response status is 201
    And the required documents include "efda_manufacturing_license"

  Scenario: Pharmaceutical manufacturing requires EFDA license and GMP certificate
    Given I have a manufacturing permit application with sector "pharmaceuticals"
    When I submit the application
    Then the response status is 201
    And the required documents include "efda_manufacturing_license"
    And the required documents include "gmp_certificate"

  Scenario: Water-intensive industry requires water use permit
    Given I have a manufacturing permit application with uses_water_source true
    When I submit the application
    Then the response status is 201
    And the required documents include "water_use_permit"

  Scenario: Hazardous materials require safety management plan
    Given I have a manufacturing permit application with uses_hazardous_materials true
    When I submit the application
    Then the response status is 201
    And the required documents include "hazmat_safety_management_plan"

  Scenario: Large employer (100+ workers) requires EIC registration
    Given I have a manufacturing permit application with employee_count 120
    When I submit the application
    Then the response status is 201
    And the required documents include "eic_registration_certificate"

  # ── Fee Structure ─────────────────────────────────────────────────────

  Scenario: Manufacturing permit fee includes base application and inspection fees
    Given I have a manufacturing permit application with esia_category "C"
    When I submit the application
    Then the total fee is at least 4000 ETB (1000 application + 3000 inspection)

  Scenario: Category A permit is most expensive
    Given Category A total fee is greater than Category B total fee
    And Category B total fee is greater than Category C total fee

  # ── Workflow Lifecycle ────────────────────────────────────────────────

  Scenario: Technical assessor routes Category A to environmental review
    Given there is a SUBMITTED manufacturing permit application with esia_category "A"
    And I am authenticated as a "technical-assessor" operator
    When I complete the technical-assessment task with decision "APPROVED"
    Then a new task is created for the "environmental-officer" role

  Scenario: Technical assessor routes Category C directly to permit authority
    Given there is a SUBMITTED manufacturing permit application with esia_category "C"
    And I am authenticated as a "technical-assessor" operator
    When I complete the technical-assessment task with decision "APPROVED"
    Then the next task is assigned to the "permit-authority" role

  Scenario: Environmental review rejection terminates the application
    Given there is an application at the environmental-review stage
    And I am authenticated as an "environmental-officer" operator
    When I complete the environmental-review task with decision "REJECTED" and notes "ESIA assessment incomplete"
    Then the application status becomes "REJECTED"
    And no further tasks are created
