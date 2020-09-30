document.addEventListener('DOMContentLoaded', () => {
    const CURRENT_PLAYER_TURN = 'user';
    const ENEMY_PLAYER_TURN = 'enemy';

    const userGrid = document.querySelector('.grid-user');
    const computerGrid = document.querySelector('.grid-computer');
    const displayGrid = document.querySelector('.grid-display');

    const allShips = document.querySelectorAll('.ship');
    const destroyer = document.querySelector('.destroyer-container');
    const submarine = document.querySelector('.submarine-container');
    const cruiser = document.querySelector('.cruiser-container');
    const battleship = document.querySelector('.battleship-container');
    const carrier = document.querySelector('.carrier-container');

    const startButton = document.querySelector('#start');
    const rotateButton = document.querySelector('#rotate');
    const turnDisplay = document.querySelector('#whose-go');
    const infoDisplay = document.querySelector('#info');
    const singlePlayerButton = document.querySelector('#singlePlayerButton');
    const multiPlayerButton = document.querySelector('#multiPlayerButton');

    // game logic
    let isGameOver = false;
    let currentPlayer = 'user';

    const width = 10;
    let gameMode = "";
    let playerNum = 0;
    let ready = false;
    let enemyReady = false;
    let allShipsPlaced = false;
    let shotFired = -1;

    // Select Player Mode
    singlePlayerButton.addEventListener("click", () => {
        gameMode = "singlePlayer";

        generateShip(ships[0], computerSquares);
        generateShip(ships[1], computerSquares);
        generateShip(ships[2], computerSquares);
        generateShip(ships[3], computerSquares);
        generateShip(ships[4], computerSquares);

        startButton.addEventListener('click', playGame);
    });

    multiPlayerButton.addEventListener("click", () => {
        gameMode = "multiPlayer";

        const socket = io();

        // Get your player number
        socket.on('player-number', number => {
            console.log('app.js ', 'player-number socket');
            if (number === -1) {
                infoDisplay.innerHTML = "Sorry, the server is full";
            } else {
                playerNum = parseInt(number);
                if (playerNum === 1) currentPlayer = "enemy";
                console.log(playerNum);
                // when we connect, are there any other players here?
                socket.emit('check-players');
            }

        });

        socket.on('player-connection', num => {
            console.log('app.js ', 'player-connection socket');
            console.log(`Player number ${num} has connected or disconnected`);
            playerConnectedOrDisconnected(num);
        });

        startButton.addEventListener('click', () => {
            if (allShipsPlaced) playGameMulti(socket);
            else infoDisplay.innerHTML = "Please place all ships";
        });

        computerSquares.forEach(square => {
            square.addEventListener('click', () => {
                if (currentPlayer === CURRENT_PLAYER_TURN && ready && enemyReady) {
                    shotFired = square.dataset.id;
                    console.log('shots fired ', shotFired);
                    socket.emit('fire', shotFired);
                    turnDisplay.innerHTML = `${enemy}'s turn`
                }
            })
        });

        socket.on('fire', id => {
            enemyGo(id);
            const square = userSquares[id];
            socket.on('fire-reply', square.classList);
            playGameMulti(socket);
        });

        socket.on('fire-reply', classList => {
            revealSquare(classList);
            playGameMulti(socket);
        })

        socket.on('enemy-ready', playerIndex => {
            enemyReady = true;
            playerReady(playerIndex);
            if (ready) playGameMulti(socket);
        })

        socket.on('check-players', players => {
            players.forEach((player, index) => {
                if (player.connected) playerConnectedOrDisconnected(index);
                if (player.ready) {
                    playerReady(index);
                    if (index !== playerReady) enemyReady = true;
                }
            });
        });

        socket.on('timeout', () => {
            infoDisplay.innerHTML = 'You have reached the 10 minute limit';
        });

        // Another player has connected or disconnected
        const playerConnectedOrDisconnected = (num) => {
            // look for the 'p' class, (player 0 = 1; player 1 = 2)
            let player = `.p${parseInt(num) + 1}`;
            document.querySelector(`${player} .connected span`).classList.toggle('green');
            turnDisplay.innerHTML = 'Place your ships';
            // if the player that is connecting is us...
            if (parseInt(num) === playerNum)
                document.querySelector(player).getElementsByClassName.fontWeight = 'bold';
        }
    });

    const playGameMulti = (socket) => {
        if (isGameOver) return;
        if (!ready) {
            socket.emit('player-ready');
            ready = true;
            playerReady(playerNum)
        }
        if (enemyReady) {
            if (currentPlayer === CURRENT_PLAYER_TURN) {
                turnDisplay.innerHTML = 'Your Go';
            }
            if (currentPlayer === ENEMY_PLAYER_TURN) {
                turnDisplay.innerHTML = "Enemy's Go";
            }
        }
    };

    const playerReady = num => {
        let player = `.p${parseInt(num) + 1}`
        console.log('player is ready ', player);
        document.querySelector(`${player} .ready span`).classList.toggle('green');
    }

    const ships = [
        {
            name: 'destroyer',
            directions: [
                [0, 1],
                [0, width]
            ]
        },
        {
            name: 'submarine',
            directions: [
                [0, 1, 2],
                [0, width, width * 2]
            ]
        },
        {
            name: 'cruiser',
            directions: [
                [0, 1, 2],
                [0, width, width * 2]
            ]
        },
        {
            name: 'battleship',
            directions: [
                [0, 1, 2, 3],
                [0, width, width * 2, width * 3]
            ]
        },
        {
            name: 'carrier',
            directions: [
                [0, 1, 2, 3, 4],
                [0, width, width * 2, width * 3, width * 4]
            ]
        }
    ];


    const createBoard = (grid) => {
        const squareCount = 100;

        return Array(squareCount).fill()
            .map((_, iteration) => {
                let square = document.createElement('div');
                square.dataset.id = iteration;
                grid.appendChild(square);
                return square;
            });
    };

    const userSquares = createBoard(userGrid);
    const computerSquares = createBoard(computerGrid);

    const generateShip = (ship, squares) => {
        let randomDirection = Math.abs(Math.floor(Math.random() * ship.directions.length));
        let current = ship.directions[randomDirection];

        if (randomDirection === 0) direction = 1;
        if (randomDirection === 1) direction = 10;

        let randomStart = Math.abs(Math.floor((Math.random() * squares.length) - (ship.directions[0].length * direction)));

        const isTaken = current.some(index => squares[randomStart + index].classList.contains('taken'));
        const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1);
        const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0);

        if (!isTaken && !isAtRightEdge && !isAtLeftEdge) current.forEach(index => squares[randomStart + index].classList.add('taken', ship.name));
        else generateShip(ship, squares);
    };

    isHorizontal = true;

    const rotate = () => {
        if (isHorizontal) {
            destroyer.classList.toggle('destroyer-container-vertical');
            submarine.classList.toggle('submarine-container-vertical');
            cruiser.classList.toggle('cruiser-container-vertical');
            battleship.classList.toggle('battleship-container-vertical');
            carrier.classList.toggle('carrier-container-vertical');
            isHorizontal = false;
            return
        }
        if (!isHorizontal) {
            destroyer.classList.toggle('destroyer-container-vertical');
            submarine.classList.toggle('submarine-container-vertical');
            cruiser.classList.toggle('cruiser-container-vertical');
            battleship.classList.toggle('battleship-container-vertical');
            carrier.classList.toggle('carrier-container-vertical');
            isHorizontal = true;
            return
        }
    }

    rotateButton.addEventListener('click', rotate)





    let selectedShipNameWithIndex;
    let draggedShip;
    let draggedShipLength;

    allShips
        .forEach(ship => ship.addEventListener('mousedown', e => selectedShipNameWithIndex = e.target.id));

    const dragStart = e => {
        draggedShip = e.target;
        draggedShipLength = e.target.childNodes.length;
        console.log('dragStart:')
        console.log('draggedShip: ', draggedShip)
        console.log('draggedShipLength: ', draggedShipLength)
    };
    const dragOver = e => {
        e.preventDefault();
    };
    const dragEnter = e => {
        e.preventDefault();
    };
    const dragLeave = e => {
        console.log('dragLeave')
    };
    const dragDrop = e => {
        e.preventDefault();
        console.log('dragDrop');
        let shipNameWithLastId = draggedShip.lastChild.id;

        let shipName = shipNameWithLastId.slice(0, -2); // just get the ship's name
        console.log('Ship Name: ', shipName);

        let lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
        console.log('last ship index: ', lastShipIndex);
        let shipLastId = lastShipIndex + parseInt(e.target.dataset.id);
        console.log('ship last id: ', shipLastId);
        const notAllowedHorizontal = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 1, 11, 21, 31, 41, 51, 61, 71, 81, 91, 2, 12, 22, 32, 42, 52, 62, 72, 82, 92, 3, 13, 23, 33, 43, 53, 63, 73, 83, 93];
        const newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex);
        const notAllowedVertical = [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60];
        const newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex);
        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));
        console.log('Selected Ship Index: ', selectedShipIndex);

        shipLastId = shipLastId - selectedShipIndex;
        console.log('ship last id: ', shipLastId);

        if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
            Array(draggedShipLength).fill()
                .map((_, iteration) => {
                    const newLocation = parseInt(e.target.dataset.id) - selectedShipIndex + iteration;
                    userSquares[newLocation].classList.add('taken', shipName);
                })
        } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
            Array(draggedShipLength).fill()
                .map((_, iteration) => {
                    const newLocation = parseInt(e.target.dataset.id) - selectedShipIndex + (width * iteration);
                    userSquares[newLocation].classList.add('taken', shipName);
                });
        } else return

        displayGrid.removeChild(draggedShip);

        if (!displayGrid.querySelector('.ship')) allShipsPlaced = true;
    };

    const dragEnd = e => {

    };


    allShips.forEach(ship => ship.addEventListener('dragstart', dragStart));
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart));
    userSquares.forEach(square => square.addEventListener('dragover', dragOver));
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter));
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave));
    userSquares.forEach(square => square.addEventListener('drop', dragDrop));
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd));



    // game logic
    const playGame = () => {
        if (isGameOver) return;
        if (currentPlayer === CURRENT_PLAYER_TURN) {
            turnDisplay.innerHTML = 'Your Go';
            computerSquares.forEach(square => square.addEventListener('click', (e) => {
                shotFired = square.dataset.id;
                revealSquare(square.classList);
            }))
        }
        if (currentPlayer === ENEMY_PLAYER_TURN) {
            turnDisplay.innerHTML = `${enemy}'s go`
            setTimeout(enemyGo, 500);
        }
    }

    let destroyerCount = 0;
    let submarineCount = 0;
    let cruiserCount = 0;
    let battleshipCount = 0;
    let carrierCount = 0;

    const revealSquare = classList => {
        const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`);
        const obj = Object.values(classList);
        if (!enemySquare.classList.contains('boom') && currentPlayer === CURRENT_PLAYER_TURN && !isGameOver) {

            if (obj.includes('boom') || obj.includes('miss')) return;
            if (obj.includes('destroyer')) destroyerCount++;
            if (obj.includes('submarine')) submarineCount++;
            if (obj.includes('cruiser')) cruiserCount++;
            if (obj.includes('battleship')) battleshipCount++;
            if (obj.includes('carrier')) carrierCount++;
        }

        if (obj.includes('taken')) {
            enemySquare.classList.add('boom');
        } else {
            enemySquare.classList.add('miss');
        }
        currentPlayer = ENEMY_PLAYER_TURN;
        turnDisplay.innerHTML = `${enemy}'s Go`;
        if (gameMode === 'singlePlayer') playGame();
    };

    let cpuDestroyerCount = 0;
    let cpuSubmarineCount = 0;
    let cpuCruiserCount = 0;
    let cpuBattleshipCount = 0;
    let cpuCarrierCount = 0;

    const enemyGo = (square) => {
        if (gameMode === 'singlePlayer') square = Math.floor(Math.random() * userSquares.length);
        if (!userSquares[square].classList.contains('boom')) {
            if (userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++;
            if (userSquares[square].classList.contains('submarine')) cpuSubmarineCount++;
            if (userSquares[square].classList.contains('cruiser')) cpuCruiserCount++;
            if (userSquares[square].classList.contains('battleship')) cpuBattleshipCount++;
            if (userSquares[square].classList.contains('carrier')) cpuCarrierCount++;
            if (userSquares[square].classList.contains('taken')) {
                userSquares[square].classList.add('boom');
            } else {
                userSquares[square].classList.add('miss');
            }
            checkForWins();
        } else if (gameMode === 'singlePlayer') enemyGo();

        currentPlayer = CURRENT_PLAYER_TURN;
        turnDisplay.innerHTML = `${enemy}'s Go`;
        playGame();
    }


    const checkForWins = () => {
        let enemy = 'computer';
        if (gameMode === 'multiPlayer') enemy = 'enemy';
        if (destroyerCount === 2) {
            infoDisplay.innerHTML = `You sunk the ${enemy}s destroyer`
            destroyerCount = 10;
        }
        if (submarineCount === 3) {
            infoDisplay.innerHTML = `You sunk the ${enemy}s submarine`
            submarineCount = 10;
        }
        if (cruiserCount === 3) {
            infoDisplay.innerHTML = `You sunk the ${enemy}s cruiser`
            cruiserCount = 10;
        }
        if (battleshipCount === 4) {
            infoDisplay.innerHTML = `You sunk the ${enemy}s battleship`
            battleshipCount = 10;
        }
        if (carrierCount === 5) {
            infoDisplay.innerHTML = `You sunk the ${enemy}s carrier`
            carrierCount = 10;
        }

        if (cpuDestroyerCount === 2) {
            infoDisplay.innerHTML = `${enemy}s sunk your destroyer`
            cpuDestroyerCount = 10;
        }
        if (cpuSubmarineCount === 3) {
            infoDisplay.innerHTML = `${enemy}s sunk your submarine`
            cpuSubmarineCount = 10;
        }
        if (cpuCruiserCount === 3) {
            infoDisplay.innerHTML = `${enemy}s sunk your cruiser`
            cpuCruiserCount = 10;
        }
        if (cpuBattleshipCount === 4) {
            infoDisplay.innerHTML = `${enemy}s sunk your battleship`
            cpuBattleshipCount = 10;
        }
        if (cpuCarrierCount === 5) {
            infoDisplay.innerHTML = `${enemy}s sunk your carrier`
            cpuCarrierCount = 10;
        }

        if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
            infoDisplay.innerHTML = `You win`
            gameOver();
        }
        if ((cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount) === 50) {
            infoDisplay.innerHTML = `${enemy.toUpperCase()} WINS`
            gameOver();
        }
    };

    const gameOver = () => {
        isGameOver = true;
        startButton.removeEventListener('click', playGame);
    }



}); 