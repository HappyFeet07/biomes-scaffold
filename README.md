# Biomes AW Extensions Template

An easy to use template for creating extensions in Biomes.

⚙️ Built using 🏗 Scaffold-ETH 2: NextJS, RainbowKit, Hardhat, Wagmi, Viem, and Typescript.

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

1. Clone this repo & install dependencies

```
git clone https://github.com/tenetxyz/biomes-scaffold.git
cd biomes-scaffold
yarn install
```

2. Create an `.env` under `packages/hardhat` and set your deployer private key to `DEPLOYER_PRIVATE_KEY`. Deploy the extension contract.

```
yarn deploy --network garnet
```

This command deploys a test smart contract to the Redstone garnet testnet. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

3. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. By default, it will connect to the Redstone garnet Testnet. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit your smart contract `Game.sol` in `packages/hardhat/contracts`
- Edit your frontend in `packages/nextjs/pages`
- Edit your deployment scripts in `packages/hardhat/deploy`

## Documentation

Use hooks, delegations, and utils in your smart contract for easy and powerful extension.

### Hooks

A hook is a piece of extra logic which executes before and after player actions like build, mine, hit, move, etc. The player will use the client to register (and conditionally unregister) this contract to hook on to their actions.

#### Hook Smart Contract

Copy `packages/hardhat/examples/Hook.sol` to get started.

Define the logic for `onRegisterHook`, `onUnregisterHook`, `onBeforeCallSystem`, and `onAfterCallSystem` - the required functions of the inherited `IOptionalSystemHook` contract.

```
contract Game is IOptionalSystemHook {

   /**
   * @notice Executes when a system hook is registered by the user.
   * @dev Provides the ability to add custom logic or checks when a system hook is registered.
   * @param msgSender The original sender of the system call.
   * @param systemId The ID of the system
   * @param enabledHooksBitmap Bitmap indicating which hooks are enabled
   * @param callDataHash The hash of the call data for the system hook
   */
  function onRegisterHook(
    address msgSender,
    ResourceId systemId,
    uint8 enabledHooksBitmap,
    bytes32 callDataHash
  ) external override onlyBiomeWorld {}

   /**
   * @notice Executes when a system hook is unregistered by the user.
   * @dev Provides the ability to add custom logic or checks when a system hook is unregistered.
   * @param msgSender The original sender of the system call.
   * @param systemId The ID of the system
   * @param enabledHooksBitmap Bitmap indicating which hooks are enabled
   * @param callDataHash The hash of the call data for the system hook
   */
  function onUnregisterHook(
    address msgSender,
    ResourceId systemId,
    uint8 enabledHooksBitmap,
    bytes32 callDataHash
  ) external override onlyBiomeWorld {}

  /**
   * @notice Executes before the systemID.
   * @param msgSender The original sender of the system call.
   * @dev Provides the ability to add custom logic or checks before the systemID executes.
   * @param systemId The ID of the system
   * @param callData The hash of the call data for the system hook
   */
  function onBeforeCallSystem(
    address msgSender,
    ResourceId systemId,
    bytes memory callData
  ) external override onlyBiomeWorld {}

  /**
   * @notice Executes after the systemID.
   * @param msgSender The original sender of the system call.
   * @dev Provides the ability to add custom logic or checks after the systemID executes.
   * @param systemId The ID of the system
   * @param callData The hash of the call data for the system hook
  */
  function onAfterCallSystem(
    address msgSender,
    ResourceId systemId,
    bytes memory callData
  ) external override onlyBiomeWorld {}

}
```

#### Hook Client Setup

In `/packages/nextjs/components/RegisterBiomes.tsx`, enter the player actions that your smart contract should hook on to in the `GameRequiredHooks` array.

`const GameRequiredHooks: string[] = ["MineSystem"];`

### Delegations

Call actions like build, mine, hit, move, etc on the behalf of another player. The player will use the client to register (and conditionally unregister) delegation to this contract.

Copy `packages/hardhat/examples/Delegate.sol` to get started.

Define the logic for `canUnregister` - the only required function of the inherited `ICustomUnregisterDelegation` contract.

```
contract Game is ICustomUnregisterDelegation {

  /**
   * @notice Executes logic before unregistering the user's delegation to this contract.
   * @param delegator The address which has delegated control to this contract.
  */
  function canUnregister(address delegator) external returns (bool);

}

```

Use `callFrom()` to call an action on behalf of the delegator. For example:

```
 bytes memory dropCallData = abi.encodeCall(IDropSystem.drop, (inventoryEntityIds, dropCoord));

 IWorld(biomeWorldAddress).callFrom(delegatorAddress, DropSystemId, dropCallData);
```

---

Copy `packages/hardhat/examples/HookAndDelegate.sol` to get started with a smart contract that uses both delegations and hooks.

### Utils

#### Area Utils

Check if an entity is `insideArea`, or `getEntitiesInArea`.

#### Build Utils

Check if a building has been built using `buildExistsInWorld`; or if it has been built in a specific position using `buildWithPosExistsInWorld`.

#### Entity Utils

For all entities: `getObjectTypeAtCoord`, `getPosition`, `getObjectType`, `getEntityAtCoord`.

For player entities: `getEntityFromPlayer`, `getPlayerFromEntity`, `getEquipped`, `getHealth`, `getStamina`, `getIsLoggedOff`, `getLastHitTime`, `getInventory`, `getCount`, `getNumSlotsUsed`.

For item entities: `getStackable`, `getDamage`, `getDurability`, `getNumUsesLeft`.

## Examples

See branches for examples of games built using the template.
