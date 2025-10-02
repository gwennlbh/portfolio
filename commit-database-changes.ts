import { $ } from "bun";

const database = Bun.file("./works.json");

// Get current works.json
const newDatabase = await database
  .text()
  .then((text) => JSON.parse(text))
  .then((parsed) => Object.values(parsed));

// Get works.json before whats staged
// Hide staged changes
await $`git stash push --staged`;

const oldDatabase = await database
  .text()
  .then((text) => JSON.parse(text))
  .then((parsed) => Object.values(parsed));

// Reapply staged changes
await $`git stash apply`;
await $`git add works.json`;

const added = new Set<string>();
const removed = new Set<string>();
const changed = new Set<string>();

function compareEntries(a: any, b: any) {
  delete a.builtAt;
  delete a.descriptionHash;
  delete b.builtAt;
  delete b.descriptionHash;
  return JSON.stringify(a) === JSON.stringify(b);
}

for (const newEntry of newDatabase) {
  const oldEntry = oldDatabase.find((e: any) => e.id === newEntry.id);
  if (!oldEntry) {
    added.add(newEntry.id);
  } else if (!compareEntries(newEntry, oldEntry)) {
    changed.add(newEntry.id);
  }
}

for (const oldEntry of oldDatabase) {
  const newEntry = newDatabase.find((e: any) => e.id === oldEntry.id);
  if (!newEntry) {
    removed.add(oldEntry.id);
  }
}

let message = [];

if (added.size > 0) {
  message.push(`add ${Array.from(added).sort().join(", ")}`);
}

if (removed.size > 0) {
  message.push(`remove ${Array.from(removed).sort().join(", ")}`);
}

if (changed.size > 0) {
  message.push(`update ${Array.from(changed).sort().join(", ")}`);
}

if (message.length === 0) {
  message.push("no significant changes");
}

message[0] = message[0][0].toUpperCase() + message[0].slice(1);

Bun.spawnSync(["git", "commit", "-m", `🗃️ ${message.join(", ")}`]);
