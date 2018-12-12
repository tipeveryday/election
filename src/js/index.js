import React from 'react'
import ReactDOM from 'react-dom'
// import Web3 from 'web3'
import Web3 from 'aion-web3'
import './../css/index.css'

class App extends React.Component {
   constructor(props){
      super(props)
      this.state = {
         lastWinner: 0,
         numberOfBets: 0,
         minimumBet: 0,
         totalBet: 0,
         maxAmountOfBets: 0,
      }

      // Is there an injected web3 instance?
      if (typeof web3 !== 'undefined') { // AIWA Chrome extension will inject automatically
        console.log("Using web3 detected from external source like AIWA")
        console.log("✓ AIWA injected successfully");
        this.web3 = new Web3(web3.currentProvider)

      } else {
        // If no injected web3 instance is detected, fall back to Nodesmith Mastery Testnet
        // fallback is fine for development environments, but insecure ant not suitable for production
        // INJECT NODESMITH
        console.log("No web3 detected. Falling back to Nodesmith Mastery Testnet. Consider switching to AIWA for development.");
        this.web3 = new Web3(new Web3.providers.HttpProvider("https://api.nodesmith.io/v1/aion/testnet/jsonrpc?apiKey=b07fca69798743afbfc1e88e56e9af9d"));
      }

      const MyContract = web3.eth.contract([{"constant":false,"inputs":[],"name":"generateNumberWinner","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"myid","type":"bytes32"},{"name":"result","type":"string"}],"name":"__callback","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"numberOfBets","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_queryId","type":"bytes32"},{"name":"_result","type":"string"},{"name":"_proof","type":"bytes"}],"name":"__callback","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"player","type":"address"}],"name":"checkPlayerExists","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"resetData","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"bets","type":"uint256"}],"name":"updateMaxBets","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"number","type":"uint256"}],"name":"bet","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"amountWei","type":"uint256"}],"name":"updateMinimumBet","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"distributePrizes","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"numberWinner","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"minimumBet","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"maxAmountOfBets","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"players","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalBet","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"_maxAmountOfBets","type":"uint256"}],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"}])
      this.state.ContractInstance = MyContract.at("0x430d959fa54714aca8eecd61fae2661fca900e04")

      window.a = this.state
   }

   componentDidMount(){
      this.updateState()
      this.setupListeners()

      setInterval(this.updateState.bind(this), 7e3)
   }

   updateState(){
      this.state.ContractInstance.minimumBet((err, result) => {
         if(result != null){
            this.setState({
               minimumBet: parseFloat(web3.fromWei(result, 'ether'))
            })
         }
      })
      this.state.ContractInstance.totalBet((err, result) => {
         if(result != null){
            this.setState({
               totalBet: parseFloat(web3.fromWei(result, 'ether'))
            })
         }
      })
      this.state.ContractInstance.numberOfBets((err, result) => {
         if(result != null){
            this.setState({
               numberOfBets: parseInt(result)
            })
         }
      })
      this.state.ContractInstance.maxAmountOfBets((err, result) => {
         if(result != null){
            this.setState({
               maxAmountOfBets: parseInt(result)
            })
         }
      })
   }

   // Listen for events and executes the voteNumber method
   setupListeners(){
      let liNodes = this.refs.numbers.querySelectorAll('li')
      liNodes.forEach(number => {
         number.addEventListener('click', event => {
            event.target.className = 'number-selected'
            this.voteNumber(parseInt(event.target.innerHTML), done => {

               // Remove the other number selected
               for(let i = 0; i < liNodes.length; i++){
                  liNodes[i].className = ''
               }
            })
         })
      })
   }

   voteNumber(number, cb){
      let bet = this.refs['ether-bet'].value

      if(!bet) bet = 0.1

      if(parseFloat(bet) < this.state.minimumBet){
         alert('You must bet more than the minimum')
         cb()
      } else {
         this.state.ContractInstance.bet(number, {
            gas: 300000,
            from: web3.eth.accounts[0],
            value: web3.toWei(bet, 'ether')
         }, (err, result) => {
            cb()
         })
      }
   }

   render(){
      return (
         <div className="main-container">
            <h1>Pick the winning number and win AION coins 🚀</h1>

            <div className="block">
               <b>Number of bets so far:</b> &nbsp;
               <span>{this.state.numberOfBets}</span>
            </div>

            <div className="block">
               <b>Last winning number:</b> &nbsp;
               <span>{this.state.lastWinner}</span>
            </div>

            <div className="block">
               <b>Total AION bet:</b> &nbsp;
               <span>{this.state.totalBet} AION</span>
            </div>

            <div className="block">
               <b>Minimum bet:</b> &nbsp;
               <span>{this.state.minimumBet} AION</span>
            </div>

            <div className="block">
               <b>Max amount of bets:</b> &nbsp;
               <span>{this.state.maxAmountOfBets}</span>
            </div>

            <hr/>

            <h2>Vote for the next number, at 10 bets a payout event will occur</h2>

            <label>
               <b>How much AION do you want to bet? <input className="bet-input" ref="ether-bet" type="number" placeholder={this.state.minimumBet}/></b> AION
               <br/>
            </label>

            <ul ref="numbers">
               <li>1</li>
               <li>2</li>
               <li>3</li>
               <li>4</li>
               <li>5</li>
               <li>6</li>
               <li>7</li>
               <li>8</li>
               <li>9</li>
               <li>10</li>
            </ul>

            <hr/>

            <div><i>Only working with the Mastery Test Network 📡</i></div>
            <div><i>You can only vote once per account</i></div>
            <div><i>Your account is {web3.eth.defaultAccount}</i></div>
            <div><i>Your vote will be reflected when the next block is mined</i></div>
         </div>
      )
   }
}

ReactDOM.render(
   <App />,
   document.querySelector('#root')
)
