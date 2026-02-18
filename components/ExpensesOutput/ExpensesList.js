import { View } from "react-native";
import ExpenseItem from "./ExpenseItem";

function ExpensesList({ transactions }) {
  return (
    <View>
      {transactions.map((item) => (
        <ExpenseItem
          key={item.id.toString()}
          id={item.id}
          description={item.description}
          amount={item.amount}
          date={item.date}
          type={item.type}
          account_id={item.account_id}
          transfer_to_account_id={item.transfer_to_account_id}
          category_id={item.category_id}
        />
      ))}
    </View>
  );
}

export default ExpensesList;
