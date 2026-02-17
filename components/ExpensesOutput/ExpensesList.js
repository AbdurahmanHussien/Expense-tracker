import { FlatList } from "react-native";
import ExpenseItem from "./ExpenseItem";

function ExpensesList({ transactions }) {
  function renderItem({ item }) {
    return (
      <ExpenseItem
        id={item.id}
        description={item.description}
        amount={item.amount}
        date={item.date}
        type={item.type}
        account_id={item.account_id}
        transfer_to_account_id={item.transfer_to_account_id}
      />
    );
  }

  return (
    <FlatList
      data={transactions}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
    />
  );
}

export default ExpensesList;
