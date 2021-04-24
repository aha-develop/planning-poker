import React, { useState, useEffect } from "react";
import css from '../lib/css'

const EXTENSION_ID = 'aha-develop.planning-poker';
const FIELD_BASE = 'estimate';
const ESTIMATE_VALUES = [0, 1, 2, 3, 5, 8];
const PALETTE = {
  0: { color: '#666666', backgroundColor: '#f1f1f1' },
  1: { color: '#326601', backgroundColor: '#c7dbaf' },
  2: { color: '#301c42', backgroundColor: '#e5dced' },
  3: { color: '#7d630b', backgroundColor: '#faebb9' },
  5: { color: '#c76d00', backgroundColor: '#fcddb8' },
  8: { color: '#992e0b', backgroundColor: '#fac0af' }
}

function getEstimateStyle(estimate) {
  let idx = ESTIMATE_VALUES.indexOf(estimate);
  if (idx < 0) idx = 0;
  return PALETTE[idx];
}

type VoteData = {
  id: string;
  name: string;
  avatar: string;
  estimate: number;
  currentUser?: boolean;
}

const Styles = () => (
  <style>
    {
      css`
        .planning-poker {
          margin-bottom: -4px;
          display: flex;
          flex-direction: row;
          align-items: stretch;
          justify-content: space-between;
        }

        .planning-poker--controls {
          visibility: hidden;
          margin-left: 8px;
        }

        .planning-poker--controls .btn {
          white-space: nowrap;
        }

        .planning-poker:hover .planning-poker--controls {
          visibility: initial;
        }

        .planning-poker--results {
          column-count: 2;
          column-gap: 24px;
          margin-bottom: 4px;
        }

        .planning-poker--vote {
          display: flex;
        }

        .planning-poker--vote .badge {
          font-weight: 500;
          margin-right: 8px;
        }

        .planning-poker--analysis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-gap: 8px;
        }

        .planning-poker--analysis > div {
          background-color: #F1F1F1;
          padding: 8px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
        }

        .planning-poker--analysis dt {
          font-weight: 400;
          font-size: 12px;
          color: #999;
          order: 2;
        }

        .planning-poker--analysis dd {
          font-weight: 700;
          font-size: 14px;
          color: #333;
          margin: 0;
          order: 1;
        }

        .poker-card {
          display: inline-block;
          overflow: visible;
          cursor: pointer;
          margin-right: 6px;
        }

        .poker-card--frame {
          fill: white;
          stroke: #E1E1E1;
          stroke-width: 1px;
        }

        .poker-card--fill {
          fill: #F7F7F7;
        }

        .poker-card--value {
          font-size: 14px;
          font-weight: 600;
          text-anchor: middle;
          fill: #333333;
        }

        .poker-card--corner circle {
          fill: white;
        }

        .poker-card--corner text {
          font-size: 4px;
          font-weight: 700;
          text-anchor: middle;
          fill: #777777;
        }

        .poker-card:hover .poker-card--frame {
          stroke: #5CA5E0;
        }
        .poker-card:hover .poker-card--fill {
          fill: #E0EEF9;
        }
        .poker-card:hover .poker-card--value {
          fill: #0073CF;
        }
        .poker-card:hover .poker-card--corner text {
          fill: #5CA5E0;
        }
      `
    }
  </style>
)

const PokerCard = ({ width = 29, height = 40, value, onClick }) => (
  <svg className="poker-card" onClick={onClick} width={width} height={height}>
    <rect className="poker-card--frame" x="0" y="0" width={width} height={height} rx={4} />
    <rect className="poker-card--fill" x="4" y="5" width={width - 8} height={height - 9} rx={4} />
    <text className="poker-card--value" x={width / 2} y={height / 2} dy="6">{ value }</text>
    <g className="poker-card--corner" transform="translate(6, 6)">
      <circle x={4.5} y={4.5} r={4.5} />
      <text dy="2">{value}</text>
    </g>
    <g className="poker-card--corner" transform={`translate(${width - 6}, ${height - 6})`}>
      <circle x={4.5} y={4.5} r={4.5} />
      <text dy="2">{value}</text>
    </g>
  </svg>
)

const VoteForm = ({ onVote }) => (
  <div className='planning-poker--form'>
    {
      ESTIMATE_VALUES.map(estimate => {
        return <PokerCard key={estimate} value={estimate} onClick={() => onVote(estimate)} />
      })
    }
  </div>
)

const VoteList = ({ votes }) => (
  <div className='planning-poker--results'>
    {
      votes.sort((a, b) => a.estimate > b.estimate ? 1 : -1).map(vote => {
        return (
          <div className='planning-poker--vote' key={vote.id}>
            <div className='badge' style={getEstimateStyle(vote.estimate)}>{vote.estimate}</div>
            <div>
              {vote.avatar && <img alt={vote.name} src={vote.avatar} />}
              {vote.name}
            </div>
          </div>
        )
      })
    }
  </div>
)

const VoteAnalysis = ({ votes }) => {
  const estimates = votes.map(v => v.estimate);
  const min = Math.min(...estimates);
  const avg = estimates.reduce((n, sum) => n + sum, 0) / estimates.length;
  const max = Math.max(...estimates);

  return (
    <dl className="planning-poker--analysis">
      <div>
        <dt>Votes</dt>
        <dd>{votes.length}</dd>
      </div>
      <div>
        <dt>Average</dt>
        <dd>{avg}</dd>
      </div>
      <div>
        <dt>Lowest</dt>
        <dd>{min}</dd>
      </div>
      <div>
        <dt>Highest</dt>
        <dd>{max}</dd>
      </div>
    </dl>
  )
}

const PlanningPoker = ({ record, initialVotes }) => {
  const [votes, setVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState<Boolean>(votes.some(v => !!v.currentUser));

  useEffect(() => setVotes(initialVotes), [initialVotes]);

  const storeVote = async (estimate) => {
    // @ts-ignore
    const user = aha.user;
    const key = `${FIELD_BASE}:${user.id}`;
    const payload: VoteData = {
      id: String(user.id),
      name: user.name,
      avatar: user.avatarUrl,
      estimate
    }
    await record.setExtensionField(EXTENSION_ID, key, payload)

    payload.currentUser = true;
    setVotes(votes.filter(v => v.id != user.id).concat([payload]));
    setHasVoted(true)
  }

  return (
    <>
      <Styles />
      <div className='planning-poker'>
        {hasVoted ? (
          <>
            <div className="planning-poker--input">
              <VoteAnalysis votes={votes} />
              <VoteList votes={votes} />
            </div>
            <div className="planning-poker--controls">
              <button key='change-vote' className="btn btn-small btn-secondary" onClick={() => setHasVoted(false)}>Change vote</button>
            </div>
          </>
        ) : (
          <>
            <div className="planning-poker--input">
              <VoteForm onVote={storeVote} />
            </div>
            <div className="planning-poker--controls">
              <button key='see-results' className="btn btn-small btn-secondary" onClick={() => setHasVoted(true)}>See results</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
aha.on("planningPoker", ({ record, fields, container, settings }) => {
  // @ts-ignore
  const currentUserId = aha.user.id;

  // Parse the vote data
  const votes: VoteData[] = [];
  for (let key of Object.keys(fields)) {
    if (key.includes(FIELD_BASE)) {
      const payload = fields[key];

      // fixme: bad data check
      if (payload.hasOwnProperty(FIELD_BASE)) {
        votes.push(payload)

        // check if the current user has voted
        if (String(payload.id) === currentUserId) {
          payload.currentUser = true
        }
      }
    }
  }

  return <PlanningPoker record={record} initialVotes={votes} />
});