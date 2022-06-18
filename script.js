"use strict";

// BANKIST APP

import { accounts } from "./database.mjs";

// Elements
const labelWelcome = document.querySelector(".welcome");
const labelDate = document.querySelector(".date");
const labelBalance = document.querySelector(".balance__value");
const labelSumIn = document.querySelector(".summary__value--in");
const labelSumOut = document.querySelector(".summary__value--out");
const labelSumInterest = document.querySelector(".summary__value--interest");
const labelTimer = document.querySelector(".timer");

const containerApp = document.querySelector(".app");
const containerMovements = document.querySelector(".movements");

const btnLogin = document.querySelector(".login__btn");
const btnTransfer = document.querySelector(".form__btn--transfer");
const btnLoan = document.querySelector(".form__btn--loan");
const btnClose = document.querySelector(".form__btn--close");
const btnSort = document.querySelector(".btn--sort");

const inputLoginUsername = document.querySelector(".login__input--user");
const inputLoginPin = document.querySelector(".login__input--pin");
const inputTransferTo = document.querySelector(".form__input--to");
const inputTransferAmount = document.querySelector(".form__input--amount");
const inputLoanAmount = document.querySelector(".form__input--loan-amount");
const inputCloseUsername = document.querySelector(".form__input--user");
const inputClosePin = document.querySelector(".form__input--pin");

// DISPLAY WITHDRAWLS AND DEPOSITS IN THE APP CHART
const displayMovements = function (acc, sort = false) {
    containerMovements.innerHTML = "";

    // sorting all movements
    const movs = sort
        ? acc.movements.slice().sort((a, b) => a - b)
        : acc.movements;

    movs.forEach(function (mov, i) {
        const type = mov > 0 ? "deposit" : "withdrawal";

        // Loop for dates thrue the index [i]
        const date = new Date(acc.movementsDates[i]);
        const day = `${date.getDate()}`.padStart(2, 0);
        const month = `${date.getMonth() + 1}`.padStart(2, 0);
        const year = date.getFullYear();

        const displayDateTrans = `${month}/${day}/${year}`;

        const html = `
		<div class="movements__row">
			<div class="movements__type movements__type--${type}">
				${i + 1} ${type}
			</div>
            <div class="movements__date">${displayDateTrans}</div>
			<div class="movements__value">${mov} €</div>
		</div>
	`;

        containerMovements.insertAdjacentHTML("afterbegin", html);
    });
};

// CALCULATING BALANCE OF ACCOUNT
const calcDisplayBalance = function (account) {
    account.balance = account.movements.reduce((acc, mov) => acc + mov, 0);
    labelBalance.textContent = `${account.balance} €`;
};

// CALC DISPLAY SUMMARY incomes / outcomes / interest
const calcDisplaySummary = function (account) {
    const incomes = account.movements
        .filter((mov) => mov > 0)
        .reduce((acc, mov) => acc + mov, 0);
    labelSumIn.textContent = `${incomes} €`;

    const outcomes = account.movements
        .filter((mov) => mov < 0)
        .reduce((acc, mov) => acc + mov, 0);
    labelSumOut.textContent = `${Math.abs(outcomes)} €`;

    const interest = account.movements
        .filter((mov) => mov > 0)
        .map((deposit) => (deposit * account.interestRate) / 100)
        .filter((intrst) => intrst > 1)
        .reduce((acc, int) => acc + int, 0);
    labelSumInterest.textContent = `${interest.toFixed(2)} €`;
};

// MAKING USERNAME (first latter of first, middle and last names)
// if 'Sergei Koshelev' => then 'sk'
const createUserName = (accs) => {
    accs.forEach((acc) => {
        acc.username = acc.owner
            .toLowerCase()
            .split(" ")
            .map((name) => name[0])
            .join("");
    });
};
createUserName(accounts);

// UPDATE UI FUNCTION
const updateUI = function (acc) {
    displayMovements(acc);
    calcDisplayBalance(acc);
    calcDisplaySummary(acc);
};

// LOGIN OF USER CHECKING

let currentAccount;

btnLogin.addEventListener("click", function (e) {
    e.preventDefault();

    currentAccount = accounts.find(
        (acc) => acc.username === inputLoginUsername.value
    );
    if (currentAccount?.pin === Number(inputLoginPin.value)) {
        // ui welcome
        labelWelcome.textContent = `WELCOME BACK ${
            currentAccount.owner.split(" ")[0]
        } !`;
        containerApp.style.opacity = 100;

        // time = date = year handler

        const now = new Date();
        const day = `${now.getDate()}`.padStart(2, 0);
        const month = `${now.getMonth() + 1}`.padStart(2, 0);
        const year = now.getFullYear();
        const hour = `${now.getHours()}`.padStart(2, 0);
        const min = `${now.getMinutes()}`.padStart(2, 0);

        labelDate.textContent = `${month} / ${day} / ${year}, ${hour} : ${min}`;

        // remove username login and pin
        inputLoginPin.value = inputLoginUsername.value = "";
        inputLoginPin.blur();

        // display data of movements
        updateUI(currentAccount);
    }
});

// TRANSFER MONEY FROM ===> TO

btnTransfer.addEventListener("click", function (e) {
    e.preventDefault();
    // ammount and reciever variables
    const amount = Number(inputTransferAmount.value);
    const reciverAcc = accounts.find(
        (acc) => acc.username === inputTransferTo.value
    );
    // clean fields
    inputTransferTo.value = inputTransferAmount.value = "";
    // if account[sender && reciever] right / ammount right / balance right then SUCCES
    if (
        amount > 0 &&
        reciverAcc &&
        currentAccount.balance >= amount &&
        reciverAcc.username !== currentAccount.username
    ) {
        currentAccount.movements.push(-amount);
        reciverAcc.movements.push(amount);

        // add new transfer date sender and reciever
        currentAccount.movementsDates.push(new Date().toISOString());
        reciverAcc.movementsDates.push(new Date().toISOString());

        updateUI(currentAccount);
    }
});

// REQUEST LOAN
btnLoan.addEventListener("click", (e) => {
    e.preventDefault();
    const amount = Math.floor(inputLoanAmount.value);
    if (
        amount > 0 &&
        currentAccount.movements.some((mov) => mov >= amount / 10)
    ) {
        currentAccount.movements.push(amount);
        currentAccount.movementsDates.push(new Date().toISOString());
        updateUI(currentAccount);
    } else {
        alert("NOT ALOWED TO PROCCESS!");
    }
    inputLoanAmount.value = "";
});

// DELETE ACCOUNT

btnClose.addEventListener("click", function (e) {
    e.preventDefault();
    if (
        currentAccount.pin === Number(inputClosePin?.value) &&
        currentAccount.username === inputCloseUsername?.value
    ) {
        const index = accounts.findIndex(
            (acc) => acc.username === currentAccount.username
        );

        // deleteing account
        alert("YOUR ACCOUNT WILL BE DELETED!");
        accounts.splice(index, 1);

        // fixin login ui
        containerApp.style.opacity = 0;
    }
    inputClosePin.value = inputCloseUsername.value = "";
    labelWelcome.textContent = "Log in to get started";
});

// HANDLER FOR SORTING MOVEMENTS

let sorted = false;

btnSort.addEventListener("click", function (e) {
    e.preventDefault();
    displayMovements(currentAccount, !sorted);
    // on click return original state
    sorted = !sorted;
});
