# Codex Review Checklist

Before considering a feature complete:

- Does it stay monochrome?
- Does it avoid generated-image dependency for core gameplay?
- Does it work with keyboard input?
- Does it use deterministic seeds for daily mode?
- Does it submit a normalized `RunResult`?
- Are scoring functions pure and tested?
- Does the UI still look like a manga/editorial web page?
- Is the code separated into simulation, rendering, input, scoring?
