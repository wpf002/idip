// Jest mock for @op-engineering/op-sqlite — a tiny in-memory table emulation
// sufficient for offline-queue logic tests.
function open() {
  let rows = [];
  return {
    execute: (sql, params = []) => {
      const lowered = sql.trim().toLowerCase();
      if (lowered.startsWith('insert')) {
        rows.push(params);
        return { rowsAffected: 1, insertId: rows.length };
      }
      if (lowered.startsWith('delete')) {
        rows = [];
        return { rowsAffected: 0 };
      }
      if (lowered.startsWith('select')) {
        return { rows: { _array: rows, length: rows.length } };
      }
      return { rowsAffected: 0 };
    },
    close: () => undefined,
  };
}

module.exports = { open };
