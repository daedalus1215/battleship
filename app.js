document.addEventListener('DOMContentLoaded', () => {
    const userGrid = document.querySelector('.grid-user');
    const computerGrid = document.querySelector('.grid-computer');
    const displayGrid = document.querySelector('.grid-display');

    const generalShips = document.querySelector('.ship');
    const destroyer = document.querySelector('.destroyer-container');
    const submarine = document.querySelector('.submarine-container');
    const cruiser = document.querySelector('.cruiser-container');
    const battleship = document.querySelector('.battleship-container');
    const carrier = document.querySelector('.carrier-container');

    const start = document.querySelector('#start');
    const rotate = document.querySelector('#rotate');
    const turnDisplay = document.querySelector('#whose-go');
    const infoDisplay = document.querySelector('#info');


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
                [0, 1, 2],
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
        let randomDirection = Math.floor(Math.random() * ship.directions.length);
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
});         