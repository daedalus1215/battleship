document.addEventListener('DOMContentLoaded', () => {
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
    // game logic
    let isGameOver = false;
    let currentPlayer = 'user';

    const width = 10;
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

    const generateShip = (ship, computerSquares) => {
        let randomDirection = Math.abs(Math.floor(Math.random() * ship.directions.length));
        let current = ship.directions[randomDirection];

        if (randomDirection === 0) direction = 1;
        if (randomDirection === 1) direction = 10;

        let randomStart = Math.abs(Math.floor((Math.random() * computerSquares.length) - (ship.directions[0].length * direction)));

        const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'));
        const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1);
        const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0);

        if (!isTaken && !isAtRightEdge && !isAtLeftEdge) current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name));
        else generateShip(ship, computerSquares);
    };

    generateShip(ships[0], computerSquares);
    generateShip(ships[1], computerSquares);
    generateShip(ships[2], computerSquares);
    generateShip(ships[3], computerSquares);
    generateShip(ships[4], computerSquares);

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
        if (currentPlayer === 'user') {
            turnDisplay.innerHTML = 'Your Go';
            computerSquares.forEach(square => square.addEventListener('click', (e) => {
                revealSquare(square);
            }))
        }
        if (currentPlayer === 'computer') {
            turnDisplay.innerHTML = 'Computers Go'
            setTimeout(computerGo, 500);
        }
    }

    startButton.addEventListener('click', playGame);

    let destroyerCount = 0;
    let submarineCount = 0;
    let cruiserCount = 0;
    let battleshipCount = 0;
    let carrierCount = 0;

    const revealSquare = square => {
        if (square.classList.contains('boom') || square.classList.contains('miss')) return;
        if (square.classList.contains('destroyer')) destroyerCount++;
        if (square.classList.contains('submarine')) submarineCount++;
        if (square.classList.contains('cruiser')) cruiserCount++;
        if (square.classList.contains('battleship')) battleshipCount++;
        if (square.classList.contains('carrier')) carrierCount++;

        if (square.classList.contains('taken')) {
            square.classList.add('boom');
        } else {
            square.classList.add('miss');
        }
        currentPlayer = 'computer';
        turnDisplay.innerHTML = 'Computers Go';
        playGame();
    };

    let cpuDestroyerCount = 0;
    let cpuSubmarineCount = 0;
    let cpuCruiserCount = 0;
    let cpuBattleshipCount = 0;
    let cpuCarrierCount = 0;

    const computerGo = () => {
        let random = Math.floor(Math.random() * userSquares.length);
        if (!userSquares[random].classList.contains('boom')) {
            if (userSquares[random].classList.contains('destroyer')) cpuDestroyerCount++;
            if (userSquares[random].classList.contains('submarine')) cpuSubmarineCount++;
            if (userSquares[random].classList.contains('cruiser')) cpuCruiserCount++;
            if (userSquares[random].classList.contains('battleship')) cpuBattleshipCount++;
            if (userSquares[random].classList.contains('carrier')) cpuCarrierCount++;
            if (userSquares[random].classList.contains('taken')) {
                userSquares[random].classList.add('boom');
            } else {
                userSquares[random].classList.add('miss');
            }
            checkForWins();
        } else {
            computerGo();
        }

        currentPlayer = 'user';
        turnDisplay.innerHTML = 'Your Go';
        playGame();
    }


    const checkForWins = () => {
        if (destroyerCount === 2) {
            infoDisplay.innerHTML = "You sunk the computers destroyer"
            destroyerCount = 10;
        }
        if (submarineCount === 3) {
            infoDisplay.innerHTML = "You sunk the computers submarine"
            submarineCount = 10;
        }
        if (cruiserCount === 3) {
            infoDisplay.innerHTML = "You sunk the computers cruiser"
            cruiserCount = 10;
        }
        if (battleshipCount === 4) {
            infoDisplay.innerHTML = "You sunk the computers battleship"
            battleshipCount = 10;
        }
        if (carrierCount === 5) {
            infoDisplay.innerHTML = "You sunk the computers carrier"
            carrierCount = 10;
        }

        if (cpuDestroyerCount === 2) {
            infoDisplay.innerHTML = "Cpu sunk your destroyer"
            cpuDestroyerCount = 10;
        }
        if (cpuSubmarineCount === 3) {
            infoDisplay.innerHTML = "Cpu sunk your submarine"
            cpuSubmarineCount = 10;
        }
        if (cpuCruiserCount === 3) {
            infoDisplay.innerHTML = "Cpu sunk your cruiser"
            cpuCruiserCount = 10;
        }
        if (cpuBattleshipCount === 4) {
            infoDisplay.innerHTML = "Cpu sunk your battleship"
            cpuBattleshipCount = 10;
        }
        if (cpuCarrierCount === 5) {
            infoDisplay.innerHTML = "Cpu sunk your carrier"
            cpuCarrierCount = 10;
        }

        if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
            infoDisplay.innerHTML = "You win"
            gameOver();
        }
        if ((cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount) === 50) {
            infoDisplay.innerHTML = "Computer win"
            gameOver();
        }
    };

    const gameOver = () => {
        isGameOver = true;
        startButton.removeEventListener('click', playGame);
    }

}); 