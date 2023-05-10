
import {shouldBehaveLikeBackedBySubscriptionFactory} from "./backedby.subscriptionFactory.behavior"
import {shouldBehaveLikeBackedBySubscriptions} from "./backedby.subscriptions.behavior"
describe("BackedBy", async () => {
  await shouldBehaveLikeBackedBySubscriptionFactory();
  await shouldBehaveLikeBackedBySubscriptions();
  });