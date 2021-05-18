import React, { useState, useEffect } from "react";
import css from '../lib/css';

export const PlanningPokerStyles = () => (
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
          margin-bottom: 4px;
        }

        .planning-poker--vote > * {
          white-space: nowrap;
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
);