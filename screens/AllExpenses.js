import { useContext } from "react";
import { useTranslation } from "react-i18next";
import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import { AppContext } from "../store/app-context";

function AllExpenses() {
  const { transactions } = useContext(AppContext);
  const { t } = useTranslation();

  return (
    <ExpensesOutput expensesPeriod={t("all.total")} transactions={transactions} />
  );
}

export default AllExpenses;
