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
    const startButtons = document.querySelector('#setup-buttons');

    // game logic
    let isGameOver = false;
    let currentPlayer = 'user';

    const width = 10;
    let playerNum = 0; // @TODO: Similar to playerNumber, we need to move this
    let ready = false;
    let enemyReady = false;
    let allShipsPlaced = false;
    let shotFired = -1;

    let isHorizontal = true;
    let selectedShipNameWithIndex;
    let draggedShip;
    let draggedShipLength;

    const generateShip = (ship, squares) => {
        let randomDirection = Math.abs(Math.floor(Math.random() * ship.directions.length));
        let current = ship.directions[randomDirection];

        if (randomDirection === 0) direction = 1;
        if (randomDirection === 1) direction = 10;

        let randomStart = Math.abs(Math.floor((Math.random() * squares.length) - (ship.directions[0].length * direction)));

        const isTaken = current.some(index => squares[randomStart + index].classList.contains('taken'));
        const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1);
        const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0);

        if (!isTaken && !isAtRightEdge && !isAtLeftEdge) {
            current.forEach(index => {
                squares[randomStart + index].classList.add('taken', ship.name);
            });
        } else {
            generateShip(ship, squares);
        }
    };

    const playerReady = num => {
        let player = `.p${parseInt(num) + 1}`
        console.log('player is ready ', player);
        document.querySelector(`${player} .ready`).classList.toggle('active');
    }

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

    const userSquares = createBoard(userGrid);
    const computerSquares = createBoard(computerGrid);

    // game logic for SinglePlayer
    const playGameSingle = () => {
        if (isGameOver) return;
        if (currentPlayer === CURRENT_PLAYER_TURN) {
            turnDisplay.innerHTML = 'Your Go';
            computerSquares.forEach(square => square.addEventListener('click', (e) => {
                console.log('shot fired');
                shotFired = square.dataset.id;
                revealSquare(square.classList);
            }))
        }
        if (currentPlayer === ENEMY_PLAYER_TURN) {
            turnDisplay.innerHTML = "Computer's go";
            setTimeout(enemyGo, 1000);
        }
    }

    // Select Player Mode
    const startSinglePlayer = () => {
        generateShip(ships[0], computerSquares);
        generateShip(ships[1], computerSquares);
        generateShip(ships[2], computerSquares);
        generateShip(ships[3], computerSquares);
        generateShip(ships[4], computerSquares);
        startButtons.addEventListener('click', () => {
            startButtons.style.display = 'none';
            playGameSingle();
        });
    };

    // Multiplayer
    const startMultiPlayer = () => {
        const socket = io();
        // Get your player number
        socket.on('player-number', num => {
            if (num === -1) {
                infoDisplay.innerHTML = "Sorry, the server is full"
            } else {
                playerNum = parseInt(num)
                if (playerNum === 1) currentPlayer = "enemy"
                // console.log(playerNum)
                // Get other player status
                socket.emit('check-players')
            }
        })

        // Another player has connected or disconnected
        socket.on('player-connection', num => {
            console.log(`Player number ${num} has connected or disconnected`)
            playerConnectedOrDisconnected(num)
        })

        // On enemy ready
        socket.on('enemy-ready', num => {
            enemyReady = true
            playerReady(num)
            if (ready) {
                setupButtons.style.display = 'none';
                playGameMulti(socket);
            }
        })

        // Check player status
        socket.on('check-players', players => {
            players.forEach((p, i) => {
                if (p.connected) playerConnectedOrDisconnected(i)
                if (p.ready) {
                    playerReady(i)
                    if (i !== playerReady) enemyReady = true
                }
            })
        })

        // On Timeout
        socket.on('timeout', () => {
            infoDisplay.innerHTML = 'You have reached the 10 minute limit'
        })

        // Ready button click
        startButton.addEventListener('click', () => {
            if (allShipsPlaced) playGameMulti(socket)
            else infoDisplay.innerHTML = "Please place all ships"
        })

        // Setup event listeners for firing
        computerSquares.forEach(square => {
            console.log('clicked on square');
            square.addEventListener('click', () => {
                if (currentPlayer === 'user' && ready && enemyReady) {
                    shotFired = square.dataset.id
                    socket.emit('fire', shotFired)
                }
            })
        })

        // On Fire Received
        socket.on('fire', id => {
            enemyGo(id)
            const square = userSquares[id]
            socket.emit('fire-reply', square.classList)
            playGameMulti(socket)
        })

        // On Fire Reply Received
        socket.on('fire-reply', classList => {
            revealSquare(classList)
            playGameMulti(socket)
        })

        function playerConnectedOrDisconnected(num) {
            let player = `.p${parseInt(num) + 1}`
            document.querySelector(`${player} .connected`).classList.toggle('active')
            if (parseInt(num) === playerNum) document.querySelector(player).style.fontWeight = 'bold'
        }
    }

    if (gameMode === 'singlePlayer') {
        startSinglePlayer();
    } else {
        startMultiPlayer();
    }

    //@TODO: Can do this more gracefully
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


    allShips
        .forEach(ship => {
            ship.addEventListener('mousedown', e => {
                selectedShipNameWithIndex = e.target.id;
            });
        });

    const dragStart = e => {
        console.log('drag starting', e.target);
        draggedShip = e.target;
        draggedShipLength = e.target.childNodes.length;
    };
    const dragOver = e => {
        e.preventDefault();
        console.log('Target id ', e.target.dataset.id);

        const { shipName, lengthOfShip, intendedBowPos } = getShipNameLengthAndIntendedBowPosition(e.target.dataset.id, draggedShip.lastChild.id);

        const { newNotAllowedHorizontal, newNotAllowedVertical } = getNotAllowedHorizontalAndVerticalLocations(lengthOfShip);


        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));
        // console.log('Selected Ship Index: ', selectedShipIndex);
        const deltaIntendedBowPos = intendedBowPos - selectedShipIndex;

        if (isHorizontal && !newNotAllowedHorizontal.includes(deltaIntendedBowPos)) {
            Array(draggedShipLength).fill()
                .map((_, iteration) => {
                    const newLocation = parseInt(e.target.dataset.id) - selectedShipIndex + iteration;
                    userSquares[newLocation].classList.add('ship-hover');
                })
            // As long as the index of the ship you are dragging is not in the newNotAllowedVertical array.
            // This means that sometimes if you drag the ship by its index-1 or index-2 and so on,
            // the ship will rebound back to the displayGrid.
        } else if (!isHorizontal && !newNotAllowedVertical.includes(deltaIntendedBowPos)) {
            Array(draggedShipLength).fill()
                .map((_, iteration) => {
                    const newLocation = parseInt(e.target.dataset.id) - selectedShipIndex + (width * iteration);
                    userSquares[newLocation].classList.add('ship-hover');
                });
        } else return


    };
    const dragEnter = e => {
        e.preventDefault();
    };
    const dragLeave = e => { 
        e.preventDefault();


        const { shipName, lengthOfShip, intendedBowPos } = getShipNameLengthAndIntendedBowPosition(e.target.dataset.id, draggedShip.lastChild.id);

        const { newNotAllowedHorizontal, newNotAllowedVertical } = getNotAllowedHorizontalAndVerticalLocations(lengthOfShip);


        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));
        // console.log('Selected Ship Index: ', selectedShipIndex);
        const deltaIntendedBowPos = intendedBowPos - selectedShipIndex;

        if (isHorizontal && !newNotAllowedHorizontal.includes(deltaIntendedBowPos)) {
            Array(draggedShipLength).fill()
                .map((_, iteration) => {
                    const newLocation = parseInt(e.target.dataset.id) - selectedShipIndex + iteration;
                    userSquares[newLocation].classList.remove('ship-hover');
                })
            // As long as the index of the ship you are dragging is not in the newNotAllowedVertical array.
            // This means that sometimes if you drag the ship by its index-1 or index-2 and so on,
            // the ship will rebound back to the displayGrid.
        } else if (!isHorizontal && !newNotAllowedVertical.includes(deltaIntendedBowPos)) {
            Array(draggedShipLength).fill()
                .map((_, iteration) => {
                    const newLocation = parseInt(e.target.dataset.id) - selectedShipIndex + (width * iteration);
                    userSquares[newLocation].classList.remove('ship-hover');
                });
        } else return

    };

    /**
     * 
     * @param {String} intendedHullPos the div id we expect the hull to be dropped at.
     * @param {String} shipNameAndBowId the ship name and bow id in a format of: "shipName-bowId", e.g.: "carrier-2".
     */
    const getShipNameLengthAndIntendedBowPosition = (intendedHullPos, shipNameAndBowId) => {
        const shipName = shipNameAndBowId.slice(0, -2);
        const lengthOfShip = parseInt(shipNameAndBowId.substr(-1));
        const intendedBowPos = lengthOfShip + parseInt(intendedHullPos);

        return { shipName, lengthOfShip, intendedBowPos };
    }

    /**
     * 
     * @param {String} lengthOfShip the length of the ship, so we can figure out where it can and cannot go.
     */
    const getNotAllowedHorizontalAndVerticalLocations = (lengthOfShip) => {
        const notAllowedHorizontal = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 1, 11, 21, 31, 41, 51, 61, 71, 81, 91, 2, 22, 32, 42, 52, 62, 72, 82, 92, 3, 13, 23, 33, 43, 53, 63, 73, 83, 93]
        const notAllowedVertical = [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60]
        const newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lengthOfShip);
        const newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lengthOfShip);

        return { newNotAllowedHorizontal, newNotAllowedVertical };
    }

    const dragDrop = e => {
        const { shipName, lengthOfShip, intendedBowPos } = getShipNameLengthAndIntendedBowPosition(e.target.dataset.id, draggedShip.lastChild.id);

        const { newNotAllowedHorizontal, newNotAllowedVertical } = getNotAllowedHorizontalAndVerticalLocations(lengthOfShip);


        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));
        // console.log('Selected Ship Index: ', selectedShipIndex);
        const deltaIntendedBowPos = intendedBowPos - selectedShipIndex;

        if (isHorizontal && !newNotAllowedHorizontal.includes(deltaIntendedBowPos)) {
            Array(draggedShipLength).fill()
                .map((_, iteration) => {
                    let directionClass;
                    if (iteration === 0) directionClass = 'start';
                    if (iteration === draggedShipLength - 1) directionClass = 'end';
                    const newLocation = parseInt(e.target.dataset.id) - selectedShipIndex + iteration;
                    userSquares[newLocation].classList.add('taken', 'horizontal', directionClass, shipName);
                })
            // As long as the index of the ship you are dragging is not in the newNotAllowedVertical array.
            // This means that sometimes if you drag the ship by its index-1 or index-2 and so on,
            // the ship will rebound back to the displayGrid.
        } else if (!isHorizontal && !newNotAllowedVertical.includes(deltaIntendedBowPos)) {
            Array(draggedShipLength).fill()
                .map((_, iteration) => {
                    let directionClass;
                    if (iteration === 0) directionClass = 'start';
                    if (iteration === draggedShipLength - 1) directionClass = 'end';
                    const newLocation = parseInt(e.target.dataset.id) - selectedShipIndex + (width * iteration);
                    userSquares[newLocation].classList.add('taken', 'vertical', directionClass, shipName);
                });
        } else return

        displayGrid.removeChild(draggedShip);
        if (!displayGrid.querySelector('.ship')) allShipsPlaced = true;
    };
    const dragEnd = e => { };

    allShips.forEach(ship => ship.addEventListener('dragstart', dragStart));
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart));
    userSquares.forEach(square => square.addEventListener('dragover', dragOver));
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter));
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave));
    userSquares.forEach(square => square.addEventListener('drop', dragDrop));
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd));


    // game logic for MultiPlayer
    const playGameMulti = (socket) => {
        startButtons.style.display = 'none';
        if (isGameOver) return;
        if (!ready) {
            socket.emit('player-ready');
            ready = true;
            playerReady(playerNum);
        }
        if (enemyReady) {
            if (currentPlayer === CURRENT_PLAYER_TURN) {
                turnDisplay.innerHTML = 'Your Go';
            }
            if (currentPlayer === ENEMY_PLAYER_TURN) {
                turnDisplay.innerHTML = "Enemy's Go"
            }
        }
    };


    let destroyerCount = 0;
    let submarineCount = 0;
    let cruiserCount = 0;
    let battleshipCount = 0;
    let carrierCount = 0;

    const revealSquare = classList => {
        const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`);
        const obj = Object.values(classList);
        if (!enemySquare.classList.contains('boom') && currentPlayer === CURRENT_PLAYER_TURN && !isGameOver) {
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
        checkForWins();
        currentPlayer = ENEMY_PLAYER_TURN;
        if (gameMode === 'singlePlayer') playGameSingle();
    };

    let cpuDestroyerCount = 0;
    let cpuSubmarineCount = 0;
    let cpuCruiserCount = 0;
    let cpuBattleshipCount = 0;
    let cpuCarrierCount = 0;

    const enemyGo = (square) => {
        if (gameMode === 'singlePlayer') square = Math.floor(Math.random() * userSquares.length);
        if (!userSquares[square].classList.contains('boom')) {
            const hit = userSquares[square].classList.contains('taken');
            userSquares[square].classList.add(hit ? 'boom' : 'miss');
            if (userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++;
            if (userSquares[square].classList.contains('submarine')) cpuSubmarineCount++;
            if (userSquares[square].classList.contains('cruiser')) cpuCruiserCount++;
            if (userSquares[square].classList.contains('battleship')) cpuBattleshipCount++;
            if (userSquares[square].classList.contains('carrier')) cpuCarrierCount++;

            checkForWins();
        } else if (gameMode === 'singlePlayer') enemyGo();

        currentPlayer = CURRENT_PLAYER_TURN;
        turnDisplay.innerHTML = `Enemy's Go`;
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
        startButton.removeEventListener('click', playGameSingle);
    }
}); 