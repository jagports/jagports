#!/bin/bash

PROJECT_FIELD_ID="$1"

if [ -z "$PROJECT_FIELD_ID" ]; then
  echo "Usage: $0 PROJECT_FIELD_ID"
  exit 1
fi

read -r -d '' QUERY <<'EOF'
mutation($fieldId: ID!) {
  updateProjectV2Field(input:{
    fieldId:$fieldId,
    singleSelectOptions:[
      {name:"BACKLOG",color:GRAY,description:"Tasks waiting to be started"},
      {name:"RESEARCH",color:BLUE,description:"Investigation and information gathering"},
      {name:"PROPOSED",color:PURPLE,description:"Proposed solution awaiting decision"},
      {name:"DECISION NEEDED",color:YELLOW,description:"Requires human decision"},
      {name:"APPROVED",color:GREEN,description:"Approved and ready for execution"},
      {name:"CODING",color:BLUE,description:"Implementation in progress"},
      {name:"REVIEW",color:ORANGE,description:"Review and feedback"},
      {name:"TESTING",color:PURPLE,description:"Testing and validation"},
      {name:"DONE",color:GREEN,description:"Completed"},
      {name:"BLOCKED",color:RED,description:"Blocked by dependency or issue"}
    ]
  }) {
    projectV2Field {
      ... on ProjectV2SingleSelectField {
        name
        options {
          id
          name
          description
        }
      }
    }
  }
}
EOF

gh api graphql \
  -f query="$QUERY" \
  -f fieldId="$PROJECT_FIELD_ID"
