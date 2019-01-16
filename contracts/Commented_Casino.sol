pragma solidity ^0.4.11;

/// @title Contract to bet AION for a number and win randomly when the number of bets is met.
/// @author Merunas Grincalaitis
/// edited by Kim Codeashian
contract Casino {
  address owner;

  // The minimum bet a user has to make to participate in the game
  uint public minimumBet = 1; // Equal to 1.00 AION
  // The maximum bet a user has to make to participate in the game
  uint public maximumBet = 100; // Equal to 100 AION
  // The total number of bets the users have made
  uint public numberOfBets;
  // The maximum amount of bets can be made for each game
  uint public maxAmountOfBets = 10;
  // The total amount of AION bet for this current game
  uint public totalBet;
  
  // The number / animal that won the last game
  uint public lastLuckyAnimal;

  address[] public players;

  struct Player {
    uint amountBet;
    uint numberSelected;
  }
  // The address of the player and => the user info
  mapping(address => Player) public playerInfo;


  // Modifier to only allow the execution of functions when the bets are completed
  modifier onEndGame(){
    if(numberOfBets >= maxAmountOfBets) _;
  }
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }
  function Casino(){
    owner = msg.sender;
  }

  // Make sure contract has balance > maximumBet so
  // distributePrizes will be able to execute without failure
  function() public payable {}

  // refund all tokens back to owner
  function refund() public onlyOwner {
    uint totalBalance = this.balance;
    owner.transfer(totalBalance);
  }

  function kill() public {
    if(msg.sender == owner) selfdestruct(owner);
   }
  /// @notice Check if a player exists in the current game
  /// @param player The address of the player to check
  /// @return bool Returns true is it exists or false if it doesn't
  function checkPlayerExists(address player) public constant returns(bool){
    for(uint i = 0; i < players.length; i++){
       if(players[i] == player) return true;
    }
    return false;
 }

  /// @notice To bet for a number by sending AION
  /// @param numberSelected The number that the player wants to bet for. Must be between 1 and 10 both inclusive
  function bet(uint numberSelected) payable {
    // Check that the max amount of bets hasn't been met yet
    require(numberOfBets <= maxAmountOfBets);

    // Check that the number to bet is within the range
    require(numberSelected >= 1 && numberSelected <= 10);

    // Check that the player doesn't exists
    require(checkPlayerExists(msg.sender) == false);

    // Check that the amount paid is bigger or equal the minimum bet
    require(msg.value >= minimumBet);
    playerInfo[msg.sender].amountBet = msg.value;
    playerInfo[msg.sender].numberSelected = numberSelected;
    numberOfBets++;
    players.push(msg.sender);
    totalBet += msg.value;

    if(numberOfBets >= maxAmountOfBets) generateNumberWinner();
  }

  /// @notice Generates a random number between 1 and 10 both inclusive.
  /// Can only be executed when the game ends.
  function generateNumberWinner() onEndGame {
    uint numberGenerated = block.number % 10 + 1; // This isn't secure
    lastLuckyAnimal = numberGenerated;
    distributePrizes();
  }

  /// @notice Sends the corresponding AION to each winner then deletes all the
  /// players for the next game and resets the `totalBet` and `numberOfBets`
  function distributePrizes() onEndGame {
    address[100] memory winners; // We have to create a temporary in memory array with fixed size
    uint count = 0; // This is the count for the array of winners
    for(uint i = 0; i < players.length; i++){
       address playerAddress = players[i];
       if(playerInfo[playerAddress].numberSelected == lastLuckyAnimal){
          winners[count] = playerAddress;
          count++;
       }
       delete playerInfo[playerAddress]; // Delete all the players
    }
    players.length = 0; // Delete all the players array
    if (count > 0){
      uint winnerAIONAmount = totalBet / count; // How much each winner gets
      for(uint j = 0; j < count; j++){
        if(winners[j] != address(0)) // Check that the address in this fixed array is not empty
        winners[j].transfer(winnerAIONAmount);
      }
    }
    /* Rollover amount if no winners */
    totalBet = totalBet - winnerAIONAmount;
    numberOfBets = 0;
  }
}
