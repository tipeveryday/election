import React from 'react'
import ReactDOM from 'react-dom'
// import Web3 from 'web3'
import Web3 from 'aion-web3'
import './../css/index.css'
import casinoJSON from './../../build/contracts/Casino.json'

// console.log(casinoJSON);
let web3;
let aiwa;
let myContract;
let contractAddress = "0xa05469cA61CB30f792C27809aC9C893f8271faFF166bBC1e994ea4Aa980D68b1";
let account = "Not Detected - Please download AIWA to play this game";
let account_sub = "";
// Detect AIWA injection and inject into application
function injectWeb3() {
    // Is there an injected web3 instance?
    if (window.aionweb3) { // AIWA Chrome extension will inject automatically
        console.log("✓ AIWA injected successfully");
        web3 = new Web3(window.aionweb3.currentProvider);
        aiwa = window.aionweb3;
        // connect via Nodesmith
        // web3 = new Web3(new Web3.providers.HttpProvider("https://api.nodesmith.io/v1/aion/testnet/jsonrpc?apiKey=b07fca69798743afbfc1e88e56e9af9d"));

        // Initiate Contract at existing address
        myContract = new web3.eth.Contract(casinoJSON.info.abiDefinition,contractAddress);
        console.log('Contract Instantiated:', myContract);

        // update account when DOM mounts
        account = window.aionweb3.eth.accounts.toString(2);
        let stringg = "test";
        account_sub =  account.substring(2);
    }
}

// Main React App
class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            lastLuckyFace: "",
            numberOfBets: 0,
            minimumBet: 0,
            totalBet: 0,
            maxAmountOfBets: 0,
            accounts: account
        }
        window.a = this.state
        // this.updateState = this.updateState.bind(this)
    }

    componentDidMount() {
      console.log('componentDidMount');
      // Check for AIWA after mount
      setTimeout(function () {
          console.log(window.aionweb3);
          injectWeb3();
          this.updateState()
          this.setupListeners()
      }.bind(this), 2000);

      // poll contract info
      setInterval(this.updateState.bind(this), 7e3)
    }

    // Update DOM from Contract information
    updateState() {
      console.log('updateState hit');

      // update mininum bet value
      myContract.methods.minimumBet().call({})
      .then(function(result){
          console.log('min bet', result);
          this.setState({
            minimumBet: result
          })
      }.bind(this));

      // update total amount in bets
      myContract.methods.totalBet().call({})
      .then(function(result){
          console.log('total bet', result);
          this.setState({
            totalBet: result
          })
      }.bind(this));

      // update numberOfBets
      myContract.methods.numberOfBets().call({})
      .then(function(result){
          console.log('number of bets', result);
          this.setState({
            numberOfBets: result
          })
      }.bind(this));

      // update maximum amount of bets
      myContract.methods.maxAmountOfBets().call({})
      .then(function(result){
          console.log('maxAmountOfBets', result);
          this.setState({
            maxAmountOfBets: result
          })
      }.bind(this));

      // update last winner
      myContract.methods.lastLuckyFace().call({})
      .then(function(result){
          console.log('Last Lucky Face', result);
          let winner;
          if (result === "1") {
            winner = "Jeff Har"
          } else {
            winner = "Nick Nadeau"
          }
          this.setState({
            lastLuckyFace: winner
          })
      }.bind(this));

    }

    // Listen for events and executes the voteNumber method
    setupListeners() {
      console.log('setupListeners hit');
      let liNodes = this.refs.numbers.querySelectorAll('li')
      liNodes.forEach(number => {
          number.addEventListener('click', event => {
              event.target.className = 'number-selected'
              console.log('number selected', event.target.value);
              this.voteNumber(event.target.value, done => {
                  // Remove the other number selected
                  for (let i = 0; i < liNodes.length; i++) {
                      liNodes[i].className = ''
                  }
              })
          })
      })
    }

    // Send Number to Contract
    voteNumber(number, cb) {

      // console.log('address sub', account_sub);
      // Grab Aion Bet
      let voteCallObject;
      let bet = this.refs['aion-bet'].value;

      if (!bet) {
        // if no bet detected, set to 0 to fire alert
        bet = 0
      } else {
        // Create TX Object
        voteCallObject = {
          from: account_sub,
          to: contractAddress,
          gas: 2000000,
          value: web3.utils.toNAmp(bet),
          data: myContract.methods.bet(number).encodeABI()
        }
      }
      // Alert user if bet is less than minimum
      if (parseFloat(bet) < this.state.minimumBet) {
          alert('You must bet more than the minimum')
          cb()
      } else {
        aiwa.eth.sendTransaction(
          voteCallObject
        ).then(function(receipt){
          console.log('receipt', receipt);
          if (window.confirm('Click "OK" to see transaction receipt.')) {
            // window.location.href='https://www.google.com/chrome/browser/index.html';
            window.open(
              'https://mastery.aion.network/#/transaction/'+receipt,
              '_blank' // <- This is what makes it open in a new window.
            );
          };
          cb()
        });
      }

        // .on('transactionHash', function(hash){
        //   console.log('transactionHash', hash);
        // }).on('receipt', function(receipt){
        //   console.log('receipt', receipt);
        // })
        //

        // myContract.methods.bet(number).aionweb3.personal.sendTransaction({
        //   from: account_sub,
        //   to: "0xa01ebcef760Bc93c9EF066632e2083548357F936B6E42879380a4433F1e45d2c",
        //   gas: 2000000,
        //   value: web3.utils.toNAmp(bet)
        // })
        //-------------------
        // , (err, result) => {
        //   console.log('voteNumber result', result);
        //   cb()
        // })
        //------------------
        // myContract.bet(number, {
        //     gas: 300000,
        //     from: web3.eth.accounts[0],
        //     value: web3.toWei(bet, 'ether')
        // }, (err, result) => {
        //     cb()
        // })
      }

    render() {
        return (
            <div className="main-container">
                <h1>Pick the luckiest member of Aion Foundation and win AION coins 🚀</h1>

                <div className="block">
                    <b>Number of bets so far:</b> &nbsp;
               <span>{this.state.numberOfBets}</span>
                </div>

                <div className="block">
                    <b>Last winning face:</b> &nbsp;
               <span>{this.state.lastLuckyFace}</span>
                </div>

                <div className="block">
                    <b>Total AION pool:</b> &nbsp;
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

                <hr />

                <h2>Vote for the next randomly selected teammate, at {this.state.maxAmountOfBets} bets - a payout event will occur. If you selected right, you will receive the pot.</h2>

                <label>
                    <b>How much AION do you want to bet? <input className="bet-input" ref="aion-bet" type="number" placeholder="0"/></b> AION
               <br />
                </label>

                <ul ref="numbers">
                    <li value="1"><img width="130px" height="130px" src="https://aion.network/media/Jeff-e1526052554495-300x288.jpg" /></li>
                    <li value="2"><img width="130px" height="130px" src="https://aion.network/media/Edit-9900-e1538349709269-275x300.jpg" /></li>
                    <li value="3"><img width="130px" height="130px" src="https://aion.network/media/Matt-e1525972764837-286x300.jpg" /></li>
                    <li value="4"><img width="130px" height="130px" src="https://aion.network/media/Yulong-e1525972245734-300x300.jpg" /></li>
                    <li value="5"><img width="130px" height="130px" src="https://aion.network/media/aion-team-rohan.jpg" /></li>
                    <li value="6"><img width="130px" height="130px" src="https://aion.network/media/Kelvin-Lam-300x253.jpg" /></li>
                    <li value="7"><img width="130px" height="130px" src="https://aion.network/media/Kim-hires-2_edit-e1526002633127-289x300.jpg" /></li>
                    <li value="8"><img width="130px" height="130px" src="https://aion.network/media/Nick-e1528488297820-293x300.jpg" /></li>
                    <li value="9"><img width="130px" height="130px" src="https://aion.network/media/JenniZhang_Edit-9865-e1538349973408-265x300.jpg" /></li>
                    <li value="10"><img width="130px" height="130px" src="https://aion.network/media/Mike-Mason-e1530296023825-292x300.jpg" /></li>
                </ul>

                <hr />

                <div><i>Only working with the Mastery Test Network 📡</i></div>
                <div><i>You can only vote once per account</i></div>
                <div><i>Your account is <strong>{account}</strong></i></div>
                <div><i>Your vote will be reflected when the next block is mined.</i></div>
            </div>
        )
    }
}

ReactDOM.render(
    <App />,
    document.querySelector('#root')
)
