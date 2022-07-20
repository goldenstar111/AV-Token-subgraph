import { near, BigInt, log } from "@graphprotocol/graph-ts";
import { User } from "../generated/schema";

export function handleReceipt(receipt: near.ReceiptWithOutcome): void {
  const actions = receipt.receipt.actions;
  for (let i = 0; i < actions.length; i++) {
    handleAction(actions[i], receipt);
  }
}


function updateUser(
    address: string,
    remove: boolean,
	amount: BigInt
  ): void {
    let user = User.load(address)

    // if account doesn't exist save new account
    if (!user) {
      user = new User(address)
      user.total_owned = BigInt.zero()
    }

    user.total_owned = remove
      ? (user.total_owned = user.total_owned.minus(amount))
      : (user.total_owned = user.total_owned.plus(amount))

    user.save()
}

function handleAction(
  action: near.ActionValue,
  receiptWithOutcome: near.ReceiptWithOutcome
): void {
  if (action.kind != near.ActionKind.FUNCTION_CALL) {
    log.info("Early return: {}", ["Not a function call"]);
    return;
  }
  const outcome = receiptWithOutcome.outcome;
  const functionCall = action.toFunctionCall();
  const methodName = functionCall.methodName;
  if (methodName == "ft_transfer") {
	  const outcomeLog = outcome.logs[0].toString();
	  log.info('outcomeLog {}', [outcomeLog]) 
	  const parsed = outcomeLog.split(" ");
	  const old_owner_id = parsed[3];
	  const new_owner_id = parsed[5];
	  const amount = BigInt.fromString(parsed[1].toString());
	  updateUser(old_owner_id.toString(), true, amount);
	  updateUser(new_owner_id.toString(), false, amount);
  }
  
}
