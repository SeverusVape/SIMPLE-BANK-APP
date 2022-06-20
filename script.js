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

// DATE HANDLER FUNCTION
const formatMovementDate = function (date, locale) {
    // Calc how much days passed since've been deposited
    const calcDaysPassed = (date1, date2) =>
        Math.round(Math.abs(date1 - date2) / (1000 * 60 * 60 * 24));

    const dayPassed = calcDaysPassed(new Date(), date);

    if (dayPassed === 0) {
        return "Today";
    } else if (dayPassed === 1) {
        return "Yesterday";
    } else if (dayPassed <= 7) {
        return `${dayPassed} days ago`;
    } else {
        // Date properties
        return new Intl.DateTimeFormat(locale).format(date);
    }
};

// CURRENCY FORMATER
const currencyFormater = function (value, locale, currency) {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
    }).format(value);
};

// DISPLAY WITHDRAWLS AND DEPOSITS IN THE APP CHART
const displayMovements = function (acc, sort = false) {
    containerMovements.innerHTML = "";

    // sorting all movements
    const movs = sort
        ? acc.movements.slice().sort((a, b) => a - b)
        : acc.movements;

    movs.forEach(function (mov, i) {
        const type = mov > 0 ? "deposit" : "withdrawal";

        // Date loop
        const date = new Date(acc.movementsDates[i]);
        const displayDateTrans = formatMovementDate(date, acc.locale);

        // Main container
        const html = `
		<div class="movements__row">
			<div class="movements__type movements__type--${type}">
				${i + 1} ${type}
			</div>
            <div class="movements__date">${displayDateTrans}</div>
			<div class="movements__value">${currencyFormater(
                mov,
                acc.locale,
                acc.currency
            )}</div>
		</div>
	`;

        containerMovements.insertAdjacentHTML("afterbegin", html);
    });
};

// CALCULATING BALANCE OF ACCOUNT
const calcDisplayBalance = function (account) {
    account.balance = account.movements.reduce((acc, mov) => acc + mov, 0);
    labelBalance.textContent = currencyFormater(
        account.balance,
        account.locale,
        account.currency
    );
};

// CALC DISPLAY SUMMARY incomes / outcomes / interest
const calcDisplaySummary = function (account) {
    const incomes = account.movements
        .filter((mov) => mov > 0)
        .reduce((acc, mov) => acc + mov, 0);
    labelSumIn.textContent = currencyFormater(
        incomes,
        account.locale,
        account.currency
    );

    const outcomes = account.movements
        .filter((mov) => mov < 0)
        .reduce((acc, mov) => acc + mov, 0);
    labelSumOut.textContent = currencyFormater(
        Math.abs(outcomes),
        account.locale,
        account.currency
    );

    const interest = account.movements
        .filter((mov) => mov > 0)
        .map((deposit) => (deposit * account.interestRate) / 100)
        .filter((intrst) => intrst > 1)
        .reduce((acc, int) => acc + int, 0);
    labelSumInterest.textContent = currencyFormater(
        interest.toFixed(2),
        account.locale,
        account.currency
    );
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

// LOG IN TIMER
const startLogOutTimer = () => {
    const tick = function () {
        const min = String(Math.trunc(time / 60)).padStart(2, "0");
        const sec = String(time % 60).padStart(2, "0");
        labelTimer.textContent = `${min} : ${sec}`;
        if (time === 0) {
            clearInterval(timer);
            containerApp.style.opacity = 0;
            labelWelcome.textContent = "Log in to get started";
        }
        time--;
    };

    let time = 60 * 5;

    tick();
    const timer = setInterval(tick, 1000);
    return timer;
};

// LOGIN OF USER CHECKING
let currentAccount, timer;

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

        // time = date = year handler API in label section
        const now = new Date();
        const options = {
            hour: "numeric",
            minute: "numeric",
            day: "numeric",
            month: "long",
            year: "numeric",
            weekday: "short",
        };

        labelDate.textContent = new Intl.DateTimeFormat(
            currentAccount.locale,
            options
        ).format(now);

        // remove username login and pin
        inputLoginPin.value = inputLoginUsername.value = "";
        inputLoginPin.blur();

        // Timer
        if (timer) clearInterval(timer);
        timer = startLogOutTimer();

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

        //Reset timer if user still doing smthng
        clearInterval(timer);
        timer = startLogOutTimer();
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
        //Reset timer if user still doing smthng
        clearInterval(timer);
        timer = startLogOutTimer();
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
