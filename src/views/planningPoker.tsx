import React, { useState, useEffect } from 'react';
import lodashSortby from 'https://cdn.skypack.dev/lodash.sortby';
import { PlanningPokerStyles } from './planningPokerStyles';

const EXTENSION_ID = 'aha-develop.planning-poker';
const FIELD_BASE = 'estimate';
const PALETTE = ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f']

interface VoteData {
  id: string;
  name: string;
  avatar: string;
  estimate: number | null;
  unknown?: boolean;
}

interface Options {
  values: number[]
  includeUnknown: boolean
}

const PokerCard = ({ width = 29, height = 40, value, onClick }) => (
  <svg className="poker-card" onClick={onClick} width={width} height={height}>
    <rect
      className="poker-card--frame"
      x="0"
      y="0"
      width={width}
      height={height}
      rx={4}
    />
    <rect
      className="poker-card--fill"
      x="4"
      y="5"
      width={width - 8}
      height={height - 9}
      rx={4}
    />
    <text className="poker-card--value" x={width / 2} y={height / 2} dy="6">
      {value}
    </text>
    <g className="poker-card--corner" transform="translate(6, 6)">
      <circle x={4.5} y={4.5} r={4.5} />
      <text dy="2">{value}</text>
    </g>
    <g
      className="poker-card--corner"
      transform={`translate(${width - 6}, ${height - 6})`}
    >
      <circle x={4.5} y={4.5} r={4.5} />
      <text dy="2">{value}</text>
    </g>
  </svg>
);

const VoteForm = ({ options, onVote }) => (
  <div className="planning-poker--form">
    {options.values.map((estimate) => {
      return (
        <PokerCard
          key={estimate}
          value={estimate}
          onClick={() => onVote(estimate)}
        />
      );
    })}

    { options.includeUnknown ? 
      <PokerCard
        key="unknown"
        value="?"
        onClick={() => onVote(null)}
      />
    : '' }
  </div>
);

const VoteList = ({ options, votes }) => {
  const getEstimateStyle = (value) => {
    const index = Math.max(0, options.values.indexOf(value))
    const baseColor = PALETTE[index]

    return {
      color: 'rgba(0, 0, 0, 0.87)',
      backgroundColor: baseColor
    }
  }

  return (
    <div className="planning-poker--results">
      {lodashSortby(votes, ['estimate', 'name', 'userId']).map((vote) => {
        return (
          <div className="planning-poker--vote" key={vote.id}>
            <div className="badge" style={getEstimateStyle(vote.estimate)}>
              {vote.unknown ? "?" : vote.estimate}
            </div>
            <div>
              {vote.avatar && <img alt={vote.name} src={vote.avatar} />}
              {vote.name}
            </div>
          </div>
        );
      })}
    </div>
  )
};

const VoteAnalysis = ({ votes }) => {
  const estimates = votes.filter(v => !v.unknown).map(v => parseInt(v.estimate, 10)); // Exclude "unknown" votes
  const total = estimates.length // Total excluding unknown
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
        <dd>{total > 0 ? avg.toFixed(1) : "-"}</dd>
      </div>
      <div>
        <dt>Lowest</dt>
        <dd>{total > 0 ? min : "-"}</dd>
      </div>
      <div>
        <dt>Highest</dt>
        <dd>{total > 0 ? max : "-"}</dd>
      </div>
    </dl>
  );
};

const PlanningPoker = ({ record, options, initialVotes }) => {
  const [votes, setVotes] = useState<VoteData[]>(initialVotes);
  const [hasVoted, setHasVoted] = useState<Boolean>(
    votes.some((v) => v.id === aha.user.id)
  );

  // Update state if the intial vote count changes - i.e. another user updates
  // their vote and our parent's props change.
  useEffect(() => setVotes(initialVotes), [initialVotes]);

  const user = aha.user;
  const extensionFieldKey = `${FIELD_BASE}:${user.id}`;

  const storeVote = async (estimate) => {
    const payload: VoteData = {
      id: String(user.id),
      name: user.name,
      avatar: user.avatarUrl,
      estimate: null
    };

    if (estimate === null) {
      payload.unknown = true
    } else {
      payload.estimate = estimate
    }

    await record.setExtensionField(EXTENSION_ID, extensionFieldKey, payload);

    setVotes(votes.filter((v) => v.id != user.id).concat([payload]));
    setHasVoted(true);
  };

  const clearVote = async () => {
    setHasVoted(false);
    await record.clearExtensionField(EXTENSION_ID, extensionFieldKey);
  };

  return (
    <>
      <PlanningPokerStyles />
      <div className="planning-poker">
        {hasVoted ? (
          <>
            <div className="planning-poker--input">
              <VoteAnalysis votes={votes} />
              <VoteList options={options} votes={votes} />
            </div>
            <div className="planning-poker--controls">
              <button
                key="change-vote"
                className="btn btn-small btn-secondary"
                onClick={() => clearVote()}
              >
                Change vote
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="planning-poker--input">
              <VoteForm options={options} onVote={storeVote} />
            </div>
            <div className="planning-poker--controls">
              <button
                key="see-results"
                className="btn btn-small btn-secondary"
                onClick={() => setHasVoted(true)}
              >
                See results
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

aha.on(
  'planningPoker',
  ({ record, fields }: { record: any; fields: Record<string, VoteData> }, { settings }) => {
    // Parse the vote data
    const votes = Object.entries(fields)
      .filter(
        ([key, vote]) =>
          key.includes(FIELD_BASE) && vote.hasOwnProperty(FIELD_BASE)
      )
      .map(([_, vote]) => vote);
    const options: Options = {
      includeUnknown: settings.includeUnknown as boolean,
      values: (settings.options as string[]).map(o => parseInt(o, 10)) // Ensure options come through as numeric values
    }

    return <PlanningPoker record={record} options={options} initialVotes={votes} />;
  }
);
