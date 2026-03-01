# Arccos API Integration (Future)

## Purpose

Replace manual benchmark transcription with automated data ingestion from the Arccos B2B API. This would allow:

- Automated benchmark updates per handicap bracket
- Larger sample sizes (1.1T+ data points)
- Granular stat breakdowns not available from public blog posts
- Potential for real-time community benchmarks

## API Requirements

### Access

Arccos offers a B2B/partner API (not public). Requirements:

1. **Partnership agreement** with Arccos Golf
2. **API key** provisioned for our application
3. **Rate limits** and usage terms TBD

### Data Needed

| Stat | Arccos Field (estimated) | Our Field |
|------|--------------------------|-----------|
| Fairways in Regulation % | `fir_percentage` | `fairwayPercentage` |
| Greens in Regulation % | `gir_percentage` | `girPercentage` |
| Putts per Round | `putts_per_round` | `puttsPerRound` |
| Average Score | `scoring_average` | `averageScore` |
| Up-and-Down % | `up_and_down_percentage` | `upAndDownPercentage` |
| Penalties per Round | `penalties_per_round` | `penaltiesPerRound` |
| Scoring Distribution | `scoring_distribution` | `scoring.*PerRound` |

All stats segmented by handicap bracket (0-5, 5-10, 10-15, 15-20, 20-25, 25-30, 30+).

### Integration Architecture

```
src/lib/arccos/
  client.ts          — API client (fetch wrapper, auth, retries)
  types.ts           — Arccos API response types
  mapper.ts          — Map Arccos response to BracketBenchmark[]
  sync.ts            — Scheduled sync logic (update JSON + citations)
  README.md          — This file
```

### Sync Strategy

1. Scheduled job (cron or Vercel Cron) runs weekly/monthly
2. Fetches aggregate stats per bracket from Arccos API
3. Maps to `BracketBenchmark` schema via `mapper.ts`
4. Writes updated `handicap-brackets.json` with Arccos citation entries
5. Bumps version and changelog automatically
6. Opens PR for review (or auto-merges if within tolerance)

### Validation

- Compare Arccos values against existing Shot Scope data
- Flag any value that deviates >15% from current benchmark
- Require manual review for large deviations

## Status

Not started. Blocked on Arccos partnership/API access.

## Next Steps

- [ ] Research Arccos partner program and API documentation
- [ ] Reach out to Arccos business development
- [ ] Prototype client with mock data once API docs are available
