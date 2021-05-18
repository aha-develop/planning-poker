import React, { useState, useEffect } from "react";
import lodashSortby from 'https://cdn.skypack.dev/lodash.sortby';
import { PlanningPokerStyles } from './planningPokerStyles';

const EXTENSION_ID = 'aha-develop.planning-poker';
const FIELD_BASE = 'estimate';
const ESTIMATES = {
  '0': { color: '#666666', backgroundColor: '#f1f1f1' },
  '1': { color: '#326601', backgroundColor: '#c7dbaf' },
  '2': { color: '#301c42', backgroundColor: '#e5dced' },
  '3': { color: '#7d630b', backgroundColor: '#faebb9' },
  '5': { color: '#c76d00', backgroundColor: '#fcddb8' },
  '8': { color: '#992e0b', backgroundColor: '#fac0af' }
}
const ESTIMATE_VALUES = Object.keys(ESTIMATES);

function getEstimateStyle(estimate) {
  return ESTIMATES[estimate.toString()];
}

type VoteData = {
  id: string;
  name: string;
  avatar: string;
  estimate: number;
  currentUser?: boolean;
}

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
      lodashSortby(votes, ['estimate', 'name', 'userId']).map(vote => {
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
        <dd>{avg.toFixed(1)}</dd>
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

  // Update state if the intial vote count changes - i.e. another user updates
  // their vote and our parent's props change.
  useEffect(() => setVotes(initialVotes), [initialVotes]);

  // @ts-ignore
  const user = aha.user;
  const extensionFieldKey = `${FIELD_BASE}:${user.id}`;

  const storeVote = async (estimate) => {
    const payload: VoteData = {
      id: String(user.id),
      name: user.name,
      avatar: user.avatarUrl,
      estimate: Number(estimate),
    }
    await record.setExtensionField(EXTENSION_ID, extensionFieldKey, payload)

    payload.currentUser = true;
    setVotes(votes.filter(v => v.id != user.id).concat([payload]));
    setHasVoted(true)
  }

  const clearVote = async () => {
    setHasVoted(false);
    await record.clearExtensionField(EXTENSION_ID, extensionFieldKey);
  }

  return (
    <>
      <PlanningPokerStyles />
      <div className='planning-poker'>
        {hasVoted ? (
          <>
            <div className="planning-poker--input">
              <VoteAnalysis votes={votes} />
              <VoteList votes={votes} />
            </div>
            <div className="planning-poker--controls">
              <button key='change-vote' className="btn btn-small btn-secondary" onClick={() => clearVote()}>Change vote</button>
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