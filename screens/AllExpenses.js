import { useContext } from "react";
import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import { AppContext } from "../store/app-context";

function AllExpenses() {
  const { transactions } = useContext(AppContext);

  return (
    <ExpensesOutput expensesPeriod="Total" transactions={transactions} />
  );
}

export default AllExpenses;
