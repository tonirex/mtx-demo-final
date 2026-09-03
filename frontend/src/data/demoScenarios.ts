/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Scenario } from '../types'

/**
 * Frontend-only demo scenarios. Each carries a complete fixture for the
 * dispatcher console: caller_id (used for caller-ID auto-fill), a scripted
 * transcript, the resulting EmergencyCaseForm, the post-call DispatchSummary,
 * and seeded knowledge-base messages.
 *
 * Three scenarios cover the three dispatch tabs (FIRE / MEDICAL / POLICE)
 * and the three caller-ID paths defined in DEMO_REQUIREMENTS.md §5:
 *   1. Known number, exact match
 *   2. Known number, address overridden by caller speech
 *   3. Unknown number — manual entry required
 */

export const DEMO_SCENARIOS: Scenario[] = [
  // ────────────────────────────────────────────────────────────────────────
  // 1. FIRE — HDB kitchen grease fire (caller-ID fully matches)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-sg-fire-hdb',
    name: 'HDB Kitchen Fire — Commonwealth',
    description: 'Resident reports kitchen grease fire spreading to cabinets in an 8th-floor HDB unit.',
    is_demo: true,
    caller_id: '+6591234567',
    demo_transcript: [
      { role: 'assistant', content: 'SCDF 995, what is your emergency?' },
      { role: 'user', content: 'Hallo, my kitchen on fire lah! The stove — the fire spread to the cabinet already!' },
      { role: 'assistant', content: 'I have your address as Blk 84 Commonwealth Crescent, #08-12 — is that correct?' },
      { role: 'user', content: "Yes yes, that's correct. Please come fast, the smoke very bad already." },
      { role: 'assistant', content: 'Is anyone injured? Are you able to leave the flat safely?' },
      { role: 'user', content: 'I already outside in the corridor with my daughter. I coughing a bit. The gas hob still on — I cannot reach inside to turn off.' },
    ],
    // Mid-call patches — each fires AFTER the indicated turn (0-based) is appended.
    demo_form_updates: [
      {
        after_turn_index: 1,
        patch: {
          what: {
            emergency_type: 'fire',
            description: 'Kitchen grease fire spreading to overhead cabinets.',
            severity_estimate: 'serious',
          },
        },
        fields: ['what.emergency_type', 'what.description', 'what.severity_estimate'],
      },
      {
        after_turn_index: 3,
        patch: {
          where: {
            address: 'Blk 84 Commonwealth Crescent, #08-12, Singapore 140084',
            landmarks: 'Near Commonwealth MRT Exit B; opposite Commonwealth Crescent Market',
            confidence: 'high',
          },
        },
        fields: ['where.address', 'where.landmarks', 'where.confidence'],
      },
      {
        after_turn_index: 5,
        patch: {
          how_many: {
            people_affected: 2,
            casualties_count: 0,
            casualties_condition: ['Caller coughing from smoke', 'Young child evacuated to corridor'],
          },
          additional_info: {
            hazards: 'Grease fire — do not use water; gas hob still on per caller',
            caller_emotional_state: 'Distressed but responsive',
          },
          triage: {
            priority: 'P1_critical',
            dispatch_services: ['fire', 'ambulance'],
            rationale: 'Active structure fire with potential smoke inhalation; high-rise HDB block.',
            escalation_flags: ['Possible smoke inhalation', 'High-rise HDB — risk of vertical spread via lift shaft'],
            response_category: 'immediate',
          },
        },
        fields: [
          'how_many.people_affected',
          'how_many.casualties_condition',
          'additional_info.hazards',
          'additional_info.caller_emotional_state',
          'triage.priority',
          'triage.dispatch_services',
        ],
      },
    ],
    demo_form: {
      where: {
        address: 'Blk 84 Commonwealth Crescent, #08-12, Singapore 140084',
        floor_level: '8th floor',
        landmarks: 'Near Commonwealth MRT Exit B; opposite Commonwealth Crescent Market',
        access_notes: 'HDB lift lobby facing Crescent Link; unit along common corridor',
        confidence: 'high',
      },
      what: {
        emergency_type: 'fire',
        description: 'Kitchen grease fire spreading to overhead cabinets; heavy smoke visible from corridor.',
        severity_estimate: 'serious',
      },
      who: {
        caller_name: 'Mdm Tan Bee Leng',
        caller_phone: '+65 9123 4567',
        relationship_to_emergency: 'Resident',
      },
      how_many: {
        people_affected: 2,
        casualties_count: 0,
        casualties_condition: ['Caller coughing from smoke', 'Young child evacuated to corridor'],
      },
      triage: {
        priority: 'P1_critical',
        dispatch_services: ['fire', 'ambulance'],
        rationale: 'Active structure fire with potential smoke inhalation; high-rise HDB block.',
        escalation_flags: ['Possible smoke inhalation', 'High-rise HDB — risk of vertical spread via lift shaft'],
        response_category: 'immediate',
      },
      additional_info: {
        hazards: 'Grease fire — do not use water; gas hob still on per caller',
        caller_emotional_state: 'Distressed but responsive',
      },
      case_summary:
        'Resident reports a kitchen grease fire spreading to overhead cabinets at Blk 84 Commonwealth Crescent, #08-12. Two occupants evacuated to the corridor. Gas hob reportedly still on. SCDF fire and ambulance dispatched as P1.',
      completeness_score: { where: true, what: true, who: true, how_many: true, overall_pct: 95 },
    },
    demo_dispatch_summary: {
      emergency_type: 'fire',
      recommended_tab: 'FIRE',
      location: [
        'Blk 84 Commonwealth Crescent, #08-12, Singapore 140084',
        '8th floor — HDB lift lobby, unit along common corridor',
        'Nearest landmark: Commonwealth MRT Exit B / Commonwealth Crescent Market',
      ],
      nature: [
        'Active kitchen grease fire spreading to overhead cabinets',
        'Heavy smoke visible from corridor window',
        'Gas hob reportedly still on',
      ],
      video_observations: [],
      interpretations: [],
      people: [
        '2 occupants — caller (Mdm Tan Bee Leng) and young daughter',
        'Both evacuated to 8th-floor corridor',
        'Caller reports mild smoke inhalation (coughing)',
      ],
      hazards: [
        'Grease fire — DO NOT use water',
        'Gas hob still active — risk of gas ignition',
        'High-rise HDB — risk of vertical spread via lift shaft and corridor',
      ],
      units: [
        'Red Rhino 1 — Queenstown Fire Station (fire suppression)',
        'Fire Engine 51 (high-rise support)',
        'Ambulance 29 (smoke inhalation evaluation)',
      ],
      notes: [
        'Inform Town Council to isolate gas riser if fire persists',
        'Stage ambulance at void deck for caller evaluation on arrival',
        'Advise caller to stay in corridor and keep flat door closed',
      ],
    },
    demo_knowledge_messages: [
      {
        id: 'k1',
        role: 'assistant',
        content: "Hi — I'm your SCDF knowledge assistant. Ask me about SOPs, hazard protocols, or unit dispatch procedures.",
      },
    ],
    demo_knowledge_suggestions: [
      'SOP for high-rise HDB kitchen grease fire?',
      'When should I notify Town Council to isolate the gas riser?',
      'How to instruct a caller with smoke inhalation?',
    ],
    demo_knowledge_qa: [
      {
        id: 'qa-grease-fire',
        keywords: ['grease', 'kitchen fire', 'kitchen', 'high-rise', 'high rise', 'hdb fire', 'sop'],
        answer:
          'For a grease fire in a high-rise HDB, advise the caller NOT to use water. If safely reachable, cover with a lid or use a fire blanket. Evacuate occupants and keep the flat door closed to contain smoke. Dispatch one Red Rhino + one fire engine for high-rise support, plus an ambulance for smoke inhalation assessment. Notify Town Council to isolate the gas riser if not quickly contained.',
        sources: ['SCDF SOP-FF-07 §4.1', 'SCDF High-Rise Fire Fighting Manual v3'],
      },
      {
        id: 'qa-gas-riser',
        keywords: ['gas riser', 'town council', 'isolate gas', 'gas supply'],
        answer:
          'Notify Town Council to isolate the gas riser when (a) the gas hob is reported still on and unreachable, (b) the fire is not contained within 5 minutes of arrival, or (c) any visible flame is observed at the riser cabinet on the affected floor or floor below.',
        sources: ['SCDF SOP-FF-07 §4.3', 'HDB Town Council Coordination MOU 2023'],
      },
      {
        id: 'qa-smoke-inhalation',
        keywords: ['smoke inhalation', 'coughing', 'breathing', 'evacuate caller', 'caller safety'],
        answer:
          'Instruct the caller to move to fresh air immediately — corridor or void deck, NOT a stairwell that may be drawing smoke. Stay low if smoke is overhead. Do not re-enter the unit. Stage the ambulance at the void deck so EMTs can assess on arrival; advise caller to remain reachable on the same line.',
        sources: ['SCDF EMS Field Reference §3.2'],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // 2. MEDICAL — Traffic accident, bystander caller (number known, address
  //    differs from registered)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-sg-accident-pie',
    name: 'Traffic Accident — PIE Eunos Exit',
    description: 'Bystander reports motorcycle vs lorry accident with injuries on the PIE.',
    is_demo: true,
    caller_id: '+6598765432',
    demo_transcript: [
      { role: 'assistant', content: 'SCDF 995, what is your emergency?' },
      { role: 'user', content: "Accident on the PIE! A motorbike got knocked down by a lorry near Eunos exit, eastbound." },
      { role: 'assistant', content: 'How many people are injured? Are they conscious?' },
      { role: 'user', content: 'The motorcyclist is on the road, not moving. The lorry driver looks okay, just shaken.' },
      { role: 'assistant', content: 'Are you in a safe location? Is traffic stopped?' },
      { role: 'user', content: "I'm on the road shoulder. Cars are still passing on the right lanes — it's quite dangerous." },
      { role: 'assistant', content: 'Stay where you are. Help is on the way. What is your name?' },
      { role: 'user', content: 'Rajesh Kumar. Please send the ambulance fast, he is bleeding from his head.' },
    ],
    demo_form_updates: [
      {
        after_turn_index: 1,
        patch: {
          where: {
            address: 'PIE Eastbound, ~200 m before Eunos Exit',
            landmarks: 'Eunos exit overhead sign visible',
            confidence: 'medium',
          },
          what: {
            emergency_type: 'accident',
            description: 'Motorcycle vs lorry collision on PIE eastbound near Eunos Exit.',
            severity_estimate: 'serious',
          },
        },
        fields: [
          'where.address',
          'where.landmarks',
          'where.confidence',
          'what.emergency_type',
          'what.description',
        ],
      },
      {
        after_turn_index: 3,
        patch: {
          how_many: {
            people_affected: 2,
            casualties_count: 1,
            casualties_condition: ['Motorcyclist unresponsive', 'Lorry driver shaken but uninjured'],
          },
          what: {
            emergency_type: 'accident',
            description: 'Motorcycle vs lorry collision; motorcyclist down and unresponsive.',
            severity_estimate: 'critical',
          },
        },
        fields: [
          'how_many.people_affected',
          'how_many.casualties_count',
          'how_many.casualties_condition',
          'what.severity_estimate',
          'what.description',
        ],
      },
      {
        after_turn_index: 5,
        patch: {
          where: {
            access_notes: 'Right shoulder — caller waving at the location',
          },
          additional_info: {
            hazards: 'Live expressway traffic; potential fuel leak',
            caller_emotional_state: 'Anxious but cooperative',
          },
          triage: {
            priority: 'P1_critical',
            dispatch_services: ['ambulance', 'police', 'fire'],
            rationale: 'Critical trauma on expressway; traffic still flowing past scene.',
            escalation_flags: ['Live traffic hazard', 'Possible head injury'],
            response_category: 'immediate',
          },
        },
        fields: [
          'where.access_notes',
          'additional_info.hazards',
          'triage.priority',
          'triage.dispatch_services',
        ],
      },
      {
        after_turn_index: 7,
        patch: {
          who: {
            caller_name: 'Mr Rajesh Kumar',
            caller_phone: '+65 9876 5432',
            relationship_to_emergency: 'Bystander',
          },
          what: {
            description: 'Motorcycle vs lorry collision; motorcyclist down, unresponsive with head bleeding.',
          },
        },
        fields: ['who.caller_name', 'who.relationship_to_emergency', 'what.description'],
      },
    ],
    demo_form: {
      where: {
        address: 'PIE Eastbound, ~200 m before Eunos Exit',
        floor_level: '',
        landmarks: 'Eunos exit overhead sign visible',
        access_notes: 'Right shoulder — caller waving at the location',
        confidence: 'medium',
      },
      what: {
        emergency_type: 'accident',
        description: 'Motorcycle vs lorry collision; motorcyclist down and unresponsive with head bleeding.',
        severity_estimate: 'critical',
      },
      who: {
        caller_name: 'Mr Rajesh Kumar',
        caller_phone: '+65 9876 5432',
        relationship_to_emergency: 'Bystander',
      },
      how_many: {
        people_affected: 2,
        casualties_count: 1,
        casualties_condition: ['Motorcyclist unresponsive, head bleeding', 'Lorry driver shaken but uninjured'],
      },
      triage: {
        priority: 'P1_critical',
        dispatch_services: ['ambulance', 'police', 'fire'],
        rationale: 'Critical trauma on expressway; traffic still flowing past scene.',
        escalation_flags: ['Live traffic hazard', 'Possible head injury'],
        response_category: 'immediate',
      },
      additional_info: {
        hazards: 'Live expressway traffic; potential fuel leak',
        caller_emotional_state: 'Anxious but cooperative',
      },
      case_summary:
        'Bystander reports a serious motorcycle vs lorry collision on the PIE eastbound, ~200 m before Eunos Exit. Motorcyclist unresponsive with head bleeding. Ambulance, police (traffic management), and SCDF fire (fuel leak risk) dispatched P1.',
      completeness_score: { where: true, what: true, who: true, how_many: true, overall_pct: 90 },
    },
    demo_dispatch_summary: {
      emergency_type: 'accident',
      recommended_tab: 'MEDICAL',
      location: [
        'PIE Eastbound, ~200 m before Eunos Exit',
        'Caller is on right road shoulder',
        'Eunos exit overhead sign visible',
      ],
      nature: [
        'Motorcycle vs lorry collision',
        'Motorcyclist down, unresponsive, head bleeding',
        'Lorry driver uninjured but shaken',
      ],
      video_observations: [],
      interpretations: [],
      people: [
        '1 critical casualty (motorcyclist)',
        '1 uninjured (lorry driver)',
        'Caller (bystander) on shoulder, in safe position',
      ],
      hazards: [
        'Live expressway traffic — vehicles still passing',
        'Possible fuel leak from motorcycle',
        'Risk to caller and casualty from passing traffic',
      ],
      units: [
        'Ambulance 14 (Bedok)',
        'Traffic Police patrol (lane closure)',
        'Fire Bike 8 (fuel containment standby)',
      ],
      notes: [
        'Request LTA to deploy lane-closure VMS upstream',
        'Advise caller to stay on shoulder until first responder arrives',
        'Verified caller phone matches registered number — physical address differs from registered',
      ],
    },
    demo_knowledge_messages: [
      {
        id: 'k1',
        role: 'assistant',
        content: "Hi — I'm your SCDF knowledge assistant. Ask me about expressway protocols, trauma triage, or multi-agency coordination.",
      },
    ],
    demo_knowledge_suggestions: [
      'Protocol for unresponsive casualty on a live expressway?',
      'Which hospital for east-side major trauma?',
      'How to coordinate LTA lane closure?',
    ],
    demo_knowledge_qa: [
      {
        id: 'qa-expressway-casualty',
        keywords: ['expressway', 'pie', 'unresponsive', 'casualty', 'live traffic', 'shoulder'],
        answer:
          'Dispatch ambulance + Traffic Police simultaneously. Request LTA to deploy upstream lane-closure VMS. Instruct caller to remain on the shoulder, do not move the casualty unless there is immediate fire risk. Send a fire unit if fuel leak is reported. Notify nearest hospital with trauma capability (e.g. Changi General for east).',
        sources: ['SCDF SOP-EMS-12 §2.4', 'Multi-agency Expressway Incident Protocol 2024'],
      },
      {
        id: 'qa-east-trauma',
        keywords: ['hospital', 'trauma', 'east', 'changi'],
        answer:
          'For major trauma in the east (PIE/ECP east of Tampines), pre-notify Changi General Hospital ED. For complex polytrauma or paediatric, divert to KK Women\'s & Children\'s only if patient is <16 y; otherwise CGH retains primary trauma capability for the eastern sector.',
        sources: ['MOH Trauma Network Routing 2025', 'SCDF EMS Field Reference §5.1'],
      },
      {
        id: 'qa-lta-coordination',
        keywords: ['lta', 'lane closure', 'vms', 'traffic management', 'coordinate'],
        answer:
          'Call LTA Operations Control on the dedicated 995 multi-agency line. Provide direction (eastbound/westbound), nearest exit, and required closure scope (right shoulder + Lane 1, etc.). LTA deploys upstream VMS within ~3 min and dispatches a TP escort vehicle if requested. Re-confirm closure once Traffic Police arrives on scene.',
        sources: ['Multi-agency Expressway Incident Protocol 2024 §3'],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // 3. POLICE — Break-in in progress, whispered call (UNKNOWN number)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-sg-breakin-tampines',
    name: 'Break-in in Progress — Tampines',
    description: 'Whispered call: resident hiding in bedroom while intruder is in the flat. Number not in directory.',
    is_demo: true,
    caller_id: '+6587776666', // intentionally NOT in CALLER_DIRECTORY
    demo_transcript: [
      { role: 'assistant', content: 'Police 999, what is your emergency?' },
      { role: 'user', content: "(whispering) Someone broke into my flat. I'm hiding in the bedroom." },
      { role: 'assistant', content: 'Stay quiet. What is your address?' },
      { role: 'user', content: 'Blk 412 Tampines Street 41, #05-216.' },
      { role: 'assistant', content: 'How many intruders? Are they armed?' },
      { role: 'user', content: "I think one person. I heard glass break and footsteps. I don't know if armed." },
      { role: 'assistant', content: 'Are you alone? Stay in the bedroom and lock the door if you can.' },
      { role: 'user', content: "Yes alone. Door is locked. Please send police quickly." },
    ],
    demo_form_updates: [
      {
        after_turn_index: 1,
        patch: {
          what: {
            emergency_type: 'crime',
            description: 'Caller reports an intruder in the flat; caller hiding in bedroom.',
            severity_estimate: 'serious',
          },
          additional_info: {
            caller_emotional_state: 'Frightened, whispering',
          },
        },
        fields: ['what.emergency_type', 'what.description', 'additional_info.caller_emotional_state'],
      },
      {
        after_turn_index: 3,
        patch: {
          where: {
            address: 'Blk 412 Tampines Street 41, #05-216, Singapore 520412',
            floor_level: '5th floor',
            landmarks: 'Near Tampines East MRT',
            confidence: 'medium',
          },
        },
        fields: ['where.address', 'where.floor_level', 'where.landmarks', 'where.confidence'],
      },
      {
        after_turn_index: 5,
        patch: {
          what: {
            description: 'Break-in in progress; suspect entered via broken glass. One occupant hiding.',
          },
          additional_info: {
            hazards: 'Possible armed suspect; broken glass at entry point',
          },
          triage: {
            priority: 'P1_critical',
            dispatch_services: ['police'],
            rationale: 'Active break-in with occupant present; possible armed suspect.',
            escalation_flags: ['Suspect possibly inside', 'Occupant hiding — silent approach required'],
            response_category: 'immediate',
          },
        },
        fields: [
          'what.description',
          'additional_info.hazards',
          'triage.priority',
          'triage.dispatch_services',
        ],
      },
      {
        after_turn_index: 7,
        patch: {
          who: {
            relationship_to_emergency: 'Resident (hiding)',
          },
          how_many: {
            people_affected: 1,
            casualties_count: 0,
          },
          where: {
            access_notes: 'Caller is in bedroom with door locked — do not announce on arrival',
          },
        },
        fields: [
          'who.relationship_to_emergency',
          'how_many.people_affected',
          'where.access_notes',
        ],
      },
    ],
    demo_form: {
      where: {
        address: 'Blk 412 Tampines Street 41, #05-216, Singapore 520412',
        floor_level: '5th floor',
        landmarks: 'Near Tampines East MRT',
        access_notes: 'Caller is in bedroom with door locked — do not announce on arrival',
        confidence: 'medium',
      },
      what: {
        emergency_type: 'crime',
        description: 'Break-in in progress; suspect entered via broken glass. One occupant hiding.',
        severity_estimate: 'serious',
      },
      who: {
        caller_name: '',
        caller_phone: '+65 8777 6666',
        relationship_to_emergency: 'Resident (hiding)',
      },
      how_many: {
        people_affected: 1,
        casualties_count: 0,
        casualties_condition: [],
      },
      triage: {
        priority: 'P1_critical',
        dispatch_services: ['police'],
        rationale: 'Active break-in with occupant present; possible armed suspect.',
        escalation_flags: ['Suspect possibly inside', 'Occupant hiding — silent approach required'],
        response_category: 'immediate',
      },
      additional_info: {
        hazards: 'Possible armed suspect; broken glass at entry point',
        caller_emotional_state: 'Frightened, whispering',
      },
      case_summary:
        'Whispered call from resident hiding in bedroom of Blk 412 Tampines Street 41, #05-216 reporting break-in in progress. Suspect believed to be inside; entry via broken glass. Police dispatched silent-approach P1.',
      completeness_score: { where: true, what: true, who: false, how_many: true, overall_pct: 70 },
    },
    demo_dispatch_summary: {
      emergency_type: 'crime',
      recommended_tab: 'POLICE',
      location: [
        'Blk 412 Tampines Street 41, #05-216, Singapore 520412',
        '5th floor — bedroom door locked from inside',
        'Nearest landmark: Tampines East MRT',
      ],
      nature: [
        'Break-in in progress',
        'Entry via broken glass (sound reported)',
        'Suspect believed to be inside the flat',
      ],
      video_observations: [],
      interpretations: [],
      people: [
        '1 occupant (caller) — hiding in bedroom, alone',
        'Suspect count unknown — at least 1',
      ],
      hazards: [
        'Possible armed suspect',
        'Broken glass at entry point',
        'Occupant in flat — minimise noise on approach',
      ],
      units: [
        'Tampines NPC Fast Response Car',
        'Tactical Patrol Force (K-9 standby)',
      ],
      notes: [
        'SILENT APPROACH — do not use sirens within 200 m',
        'Caller phone not in directory — name to be confirmed on scene',
        'Establish phone link before forced entry to confirm caller location',
      ],
    },
    demo_knowledge_messages: [
      {
        id: 'k1',
        role: 'assistant',
        content: "Hi — I'm your SPF knowledge assistant. Ask me about silent-approach protocols, hostage handling, or armed suspect procedures.",
      },
    ],
    demo_knowledge_suggestions: [
      'Silent-approach protocol for in-progress break-in?',
      'When to deploy K-9 / Tactical Patrol Force?',
      'How to keep a hiding caller safe on the line?',
    ],
    demo_knowledge_qa: [
      {
        id: 'qa-silent-approach',
        keywords: ['silent', 'silent approach', 'break-in', 'breakin', 'in-progress', 'in progress', 'occupant'],
        answer:
          "Dispatch nearest Fast Response Car with sirens off within 200 m of address. Maintain phone link with the caller throughout approach. Confirm caller location inside the unit before any forced entry. Stage TPF / K-9 unit one block away as backup. Do not approach via the suspect's entry point.",
        sources: ['SPF SOP-OPS-08 §5.2', 'SPF Tactical Approach Manual v2.1'],
      },
      {
        id: 'qa-tpf-k9',
        keywords: ['k-9', 'k9', 'tpf', 'tactical', 'backup', 'armed suspect'],
        answer:
          'Request TPF when the suspect is reported armed, when there is more than one suspect, or when the occupant is held against their will. Stage K-9 if suspect may flee on foot or evidence trail (e.g. broken glass, tool marks) is fresh. Both stage one block away with engines off; advance only on tactical commander\'s call.',
        sources: ['SPF SOP-OPS-08 §6', 'SPF K-9 Operations Manual'],
      },
      {
        id: 'qa-hiding-caller',
        keywords: ['hiding', 'whisper', 'whispered', 'keep on line', 'caller safe'],
        answer:
          'Switch the caller to whisper / mute mic if their handset supports it. Instruct: stay in locked room, do not speak unless asked yes/no questions you can answer with a single tap. Establish a tap-to-confirm code (e.g. one tap = yes, two = no). Maintain phone link until officers verbally identify themselves at the bedroom door.',
        sources: ['SPF Crisis Communication Manual §4.2'],
      },
    ],
  },
]

export const getDemoScenario = (id: string): Scenario | undefined =>
  DEMO_SCENARIOS.find(s => s.id === id)
