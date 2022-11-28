import { Square } from './Square.js';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  AccountUpdate,
} from 'snarkyjs';

(async function main() {
  await isReady;

  console.log('SnarkyJS ready');

  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  const deployerAccount = Local.testAccounts[0].privateKey;

  const zkAppPrivateKey = PrivateKey.random();
  const zkAppAddress = zkAppPrivateKey.toPublicKey();

  const contract = new Square(zkAppAddress);
  const deployTxn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    contract.deploy({ zkappKey: zkAppPrivateKey });
    contract.sign(zkAppPrivateKey);
  });
  await deployTxn.send();

  const initNum = contract.num.get();
  console.log('initNum: ', initNum.toString());

  try {
    const invalidUpdateTxn = await Mina.transaction(deployerAccount, () => {
      contract.update(Field(4));
      contract.sign(zkAppPrivateKey);
    });
    await invalidUpdateTxn.send();
  } catch (err: any) {
    console.log(err.message);
  }

  const notUpdatedNum = contract.num.get();
  console.log('Not updateted num: ', notUpdatedNum.toString());

  const validUpdateTxn = await Mina.transaction(deployerAccount, () => {
    contract.update(Field(9));
    contract.sign(zkAppPrivateKey);
  });
  await validUpdateTxn.send();

  const updatedNum = contract.num.get();
  console.log('Updated num: ', updatedNum.toString());

  console.log('Done, bye bye');

  await shutdown();
})();
