/**
 * Core salary calculation logic
 * Calculates per-day salary, gross, and net salary after advances
 *
 * @param {Number} monthlySalary - Employee's monthly salary
 * @param {Number} workingDays - Total working days in the month
 * @param {Number} presentDays - Days the employee was present
 * @param {Number} totalAdvances - Total advance amount taken in the month
 * @returns {Object} { perDaySalary, grossSalary, totalAdvances, netSalary }
 */
function calculateSalary(monthlySalary, workingDays, presentDays, totalAdvances) {
  if (workingDays <= 0) {
    throw new Error('Working days must be greater than 0');
  }

  const perDaySalary = monthlySalary / workingDays;
  const grossSalary = parseFloat((perDaySalary * presentDays).toFixed(2));
  const net = parseFloat((grossSalary - totalAdvances).toFixed(2));

  return {
    perDaySalary: parseFloat(perDaySalary.toFixed(2)),
    grossSalary,
    totalAdvances,
    netSalary: net, // Can be negative — employee owes money
  };
}

module.exports = { calculateSalary };
