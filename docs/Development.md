# Development Process, Testing and Notes

`git clone https://github.com/HausDAO/wc.git && cd wc && yarn`

### Compile contracts
`yarn build`

### Run tests (after building)
`yarn test`

### Buidler tasks
To flatten and compile the contracts:  
`npx buidler compile-flat`

To deploy the Token contract:  
`npx buidler deployToken --mnemonic ${mnemonic} --name "Token name" --symbol "SYM"`

To deploy the Factory and Minion, Transmutation, and Trust contracts:  
`npx buidler deploy --mnemonic ${mnemonic}`
