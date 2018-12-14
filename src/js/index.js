import React from 'react'
import ReactDOM from 'react-dom'
import Web3 from 'aion-web3'
import casinoJSON from './../../build/contracts/Casino.json' // import our contract JSON
import './../css/index.css' // styling

// Initializing Variables
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

        // Initiate Contract at existing address
        myContract = new web3.eth.Contract(casinoJSON.info.abiDefinition, contractAddress);
        console.log('Contract Instantiated:', myContract);
        account_sub =  account.substring(2);
    } else {
      // NODESMITH fallback
      web3 = new Web3(new Web3.providers.HttpProvider("https://api.nodesmith.io/v1/aion/testnet/jsonrpc?apiKey=b07fca69798743afbfc1e88e56e9af9d"));

      // Initiate Contract at existing address
      myContract = new web3.eth.Contract(casinoJSON.info.abiDefinition, contractAddress);
      console.log('Contract Instantiated:', myContract);
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
      }.bind(this), 3000);

      // poll contract info
      setInterval(this.updateState.bind(this), 7e3)
    }

    // Update DOM from Contract information
    updateState() {
      console.log('updateState hit');

      // update active account
      this.setState({
        // accounts: aiwa.eth.accounts.toString(),
      })
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
              console.log('event target', event.target.value);
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
      let debugObject;
      let signedBet;
      let bet = this.refs['aion-bet'].value;

      if (!bet) {
        // if no bet detected, set to 0 to fire alert
        bet = 0
        // Alert user if bet is less than minimum
        if (parseFloat(bet) < this.state.minimumBet) {
            alert('You must bet more than the minimum')
            cb()
        }
      } else {
        // Create TX Object
        voteCallObject = {
          from: account_sub,
          to: contractAddress,
          gas: 2000000,
          value: web3.utils.toNAmp(bet),
          data: myContract.methods.bet(number).encodeABI()
        }
        debugObject = {
          from: "a03824d966478a8eb43442edd577e78341cc1c6573835b31d0e3997a2553f8de",
          to: contractAddress,
          gas: 200000,
          value: web3.utils.toNAmp('2'),
          data: myContract.methods.bet(8).encodeABI()
        }
        web3.eth.accounts.signTransaction(
          debugObject, "3023c088d2da0d09dd2af5a8695483f7aaacb8b7d1e7b1fa0a400ee97072e2d143733c60fc57e6748b1787f0209f58a511a63de03e2faf06b7d388bb40a93a17"
        ).then(function(res){
          signedBet = res
          console.log(signedBet);
          web3.eth.sendSignedTransaction(
            signedBet.rawTransaction
            ).on('transactionHash', txHash => {
              console.log("txHash", txHash) }
            ).on('receipt',
              receipt => { console.log("receipt", receipt) }
            );
        });
      }
      // Alert user if bet is less than minimum
      if (parseFloat(bet) < this.state.minimumBet) {
          alert('You must bet more than the minimum')
          cb()
      } else {

        // myContract.methods.bet(8).send({
        //   from: "a03824d966478a8eb43442edd577e78341cc1c6573835b31d0e3997a2553f8de",
        //   to: contractAddress,
        //   gas: 200000,
        //   value: 200000000000000000,
        //   // web3.utils.toNAmp(2)
        // }).on('transactionHash', function(hash){
        //   console.log(hash);
        // }).on('receipt', function(receipt){
        //   // receipt example
        //   console.log(receipt);
        // })

        // ------------------------------
        // myContract.methods.bet(8).sendSigned({
        //   from: "a03824d966478a8eb43442edd577e78341cc1c6573835b31d0e3997a2553f8de",
        //   to: contractAddress,
        //   gas: 200000,
        //   value: web3.utils.toNAmp(2),
        // })
        // .then(function(receipt){
        //     // receipt can also be a new contract instance, when coming from a "contract.deploy({...}).send()"
        //     console.log(receipt);
        // });
        //--------------------------- AIWA IMPLEMENTATION CURRENTLY UNAVAILABLE
        // aiwa.eth.sendTransaction(
        //   voteCallObject
        // ).then(function(receipt){
        //   console.log('receipt', receipt);
        //   if (window.confirm('Click "OK" to see transaction receipt.')) {
        //     // window.location.href='https://www.google.com/chrome/browser/index.html';
        //     window.open(
        //       'https://mastery.aion.network/#/transaction/'+receipt,
        //       '_blank' // <- This is what makes it open in a new window.
        //     );
        //   };
        //   cb()
        // });
      }
    }

    render() {
        return (
            <div className="main-container">
              <h1>Welcome to Aion Roulette🚀</h1>
              <div className="rules">
                <div className="block ">
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
              </div>


              <hr />

              <h2>Vote who is going to be the face of Aion! <br/> When {this.state.maxAmountOfBets} bets have been placed - a new member of Aion will be randomly picked 👑 and a payout will occur. <br/> Winners who guessed correctly will split the amount in the AION pool!</h2>
              <hr />

              <h3>PLAY!</h3>
              <label>
                  <b>1. How much AION do you want to bet? <input className="bet-input" ref="aion-bet" type="number" placeholder="0"/> AION</b>
                  <br />
                  <b>2. Now pick a face!</b>
              </label>
              <ul ref="numbers">
                  <li value="1"><img width="130px" height="130px" value="1" src="https://aion.network/media/Jeff-e1526052554495-300x288.jpg" /></li>
                  <li value="2"><img width="130px" height="130px" value="2" src="https://aion.network/media/Edit-9900-e1538349709269-275x300.jpg" /></li>
                  <li value="3"><img width="130px" height="130px" value="3" src="https://aion.network/media/Matt-e1525972764837-286x300.jpg" /></li>
                  <li value="4"><img width="130px" height="130px" value="4" src="https://aion.network/media/Yulong-e1525972245734-300x300.jpg" /></li>
                  <li value="5"><img width="130px" height="130px" value="5" src="https://aion.network/media/aion-team-rohan.jpg" /></li>
                  <li value="6"><img width="130px" height="130px" value="6" src="https://aion.network/media/Kelvin-Lam-300x253.jpg" /></li>
                  <li value="7"><img width="130px" height="130px" value="7" src="https://aion.network/media/Kim-hires-2_edit-e1526002633127-289x300.jpg" /></li>
                  <li value="8"><img width="130px" height="130px" value="8" src="https://aion.network/media/Nick-e1528488297820-293x300.jpg" /></li>
                  <li value="9"><img width="130px" height="130px" value="9" src="https://aion.network/media/JenniZhang_Edit-9865-e1538349973408-265x300.jpg" /></li>
                  <li value="10"><img width="130px" height="130px" value="10" src="https://aion.network/media/Mike-Mason-e1530296023825-292x300.jpg" /></li>
              </ul>

              <hr />
              <div className="footer">
                <div><i>Only working with the Mastery Test Network 📡</i></div>
                <div><i>You can only vote once per account</i></div>
                <div><i>Your account is <strong>{this.state.accounts}</strong></i></div>
                <div><i>Your vote will be reflected when the next block is mined.</i></div>
                <div className="link"><i>Don't have AIWA? <a href="https://learn.aion.network/v1.0/docs/aiwa" target="_blank">Start here</a></i></div>
              </div>

              <div className="madeWithLove">
                <p>Made with 🔥 by the Aion Developer Success Team 🤘</p>
              </div>
          </div>
        )
    }
}

ReactDOM.render(
    <App />,
    document.querySelector('#root')
)
