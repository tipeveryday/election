pragma solidity ^0.4.11;

/// ToDo : write random generator

/// @title Contract to bet AION for a number and win randomly when the number of bets is met.
/// @author Merunas Grincalaitis
/// edited Kim Codeashian
contract Casino {
  address owner;

  // The minimum bet a user has to make to participate in the game
  uint public minimumBet = 1; // Equal to 1.00 AION

  // The total amount of AION bet for this current game
  uint public totalBet;

  // The total number of bets the users have made
  uint public numberOfBets;

  // The number / animal that won the last game
  uint public lastLuckyAnimal;

  // The maximum amount of bets can be made for each game
  uint public maxAmountOfBets = 10;

  // The max amount of bets that cannot be exceeded to avoid excessive gas consumption
  // when distributing the prizes and restarting the game
  uint public constant LIMIT_AMOUNT_BETS = 100;

  // Each number has an array of players. Associate each number with a bunch of players
  mapping(uint => address[]) numberBetPlayers;

  // The number that each player has bet for
  mapping(address => uint) playerBetsNumber;

  // Modifier to only allow the execution of functions when the bets are completed
  modifier onEndGame(){
    if(numberOfBets >= maxAmountOfBets) _;
  }

  function Casino(){
    owner = msg.sender;
  }

  /// @notice Check if a player exists in the current game
  /// @param player The address of the player to check
  /// @return bool Returns true is it exists or false if it doesn't
  function checkPlayerExists(address player) returns(bool){
    if(playerBetsNumber[player] > 0)
      return true;
    else
      return false;
  }

  /// @notice To bet for a number by sending AION
  /// @param numberToBet The number that the player wants to bet for. Must be between 1 and 10 both inclusive
  function bet(uint numberToBet) payable{
    // Check that the max amount of bets hasn't been met yet
    require(numberOfBets < maxAmountOfBets);

    // Check that the number to bet is within the range
    require(numberToBet >= 1 && numberToBet <= 10);

    // Check that the amount paid is bigger or equal the minimum bet
    require(msg.value >= minimumBet);

    // Set the number bet for that player
    playerBetsNumber[msg.sender] = numberToBet;

    // The player msg.sender has bet for that number
    numberBetPlayers[numberToBet].push(msg.sender);

    numberOfBets += 1;
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
    uint winnerAIONAmount = totalBet / numberBetPlayers[lastLuckyAnimal].length; // How much each winner gets
    // Loop through all the winners to send the corresponding prize for each one
    for(uint i = 0; i < numberBetPlayers[lastLuckyAnimal].length; i++){
      numberBetPlayers[lastLuckyAnimal][i].transfer(winnerAIONAmount);
    }

    // Delete all the players for each number
    for(uint j = 1; j <= 10; j++){
      numberBetPlayers[j].length = 0;
    }

    /* Rollover amount if no winners */
    /* totalBet = 0; */
    numberOfBets = 0;
  }
}
