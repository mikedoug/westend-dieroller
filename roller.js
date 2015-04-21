var reValid = new RegExp("^([1-9][0-9]*)[+-]?([0-9]+)?$");
var lastCache = {};

function rollD6() {
    return Math.floor(Math.random() * 6) + 1;
}

function rollIt(dice) {
    var match = reValid.exec(dice);
    if (match == null) {
        alert("Invalid Dice Entry Specification: " + dice);
        return "Invalid Dice Entry Specification: " + dice;
    }

    var dice = parseInt(match[1]);
    var pips = match[2] === undefined ? 0 : parseInt(match[2]);

    // Our response array: [dieString, totalInt, stringListOfDice]
    //   * dieString example is 5D+2
    //   * totalInt is the TOTAL of the die roll
    //   * stringListOfDice is a listing of all dice with formatting for wild dice changes (strike/bold)
    var response = ["" + dice + "D6", pips, ""];

    if (pips > 0) {
        response[0] += " + " + pips;
    }

    // Roll our dice
    var diceResults = [];
    for (; dice > 0; dice--) {
        diceResults.push(rollD6());
    }

    // Do we need to add dice?
    var extraResults = [];
    if (diceResults[0] == 6) {
        extraResults.push(rollD6());
        while(extraResults[extraResults.length-1] == 6) {
            extraResults.push(rollD6());
        }
    }

    // Now let's build up our total value AND our output string
    var diceLost = undefined;

    var die = diceResults.shift();
    if (die == 1) {
        response[2] += "<strike style='color: #bbb'>1</strike> ";
        diceLost = Math.max.apply(Math, diceResults);
    } else if (die == 6) {
        response[2] += "<b>6</b> ";
        response[1] += 6;
    } else {
        response[2] += die + " ";
        response[1] += parseInt(die);
    }

    for(die in diceResults) {
        die = diceResults[die];
        if (diceLost != undefined && diceLost == die) {
            response[2] += "<strike style='color: #bbb'>" + die + "</strike> ";
            diceLost = undefined;
        } else {
            response[2] += die + " ";
            response[1] += parseInt(die);
        }
    }

    for(die in extraResults) {
        die = extraResults[die];
        response[2] += "<b>" + die + "</b> ";
        response[1] += parseInt(die);
    }

    return response;
}

function Roller(element) {
    this.element = element;
    this.lastCache = undefined;
    this.lastResponse = undefined;

    // A helper function to roll using a rollString, append it, and clear the input field.
    this._roll_and_update = function(rollString) {
        this.lastCache = rollString;

        this.lastResponse = rollIt(rollString);
        this.addRow(this.lastResponse);

        // Clear out the input field
        this.element.value = "";
    };

    this.addRow = function(response) {
        // Add the new row to the top of our table
        $(this.element).parent().find(".resultsTable tbody").
          prepend(
            "<tr>" +
            "<td><b>" + response[0] + ":</b></td>" +
            "<td align='center'><b><font size=+3>" + response[1] + "</font></b></td>" + 
            "<td>( " + response[2] + ")</td>" +
            "<td style='padding-left: 10px'><input /></td>" + 
            "</tr>"
        );
    }

    this.characterPoint = function() {
        var rolls = [rollD6()];
        while(rolls[rolls.length-1] == 6) {
            rolls.push(rollD6());
        }

        this.lastResponse[2] += " + ( ";
        for(die in rolls) {
            die = rolls[die];
            this.lastResponse[1] += parseInt(die);
            this.lastResponse[2] += "<b>" + die + "</b> ";
        }
        this.lastResponse[2] += " ) ";
    }

    this.keypressMethod = function(e) {
        // FireFox requires this charCode and which thing...
        var keyCode = e.KeyCode || e.charCode || e.which;
        var keyChar = String.fromCharCode(keyCode);

        // Hotswitch between the columns
        try {
            var hotSwitch = $(".dieInput#" + keyChar);
            if (hotSwitch.length > 0) {
                $(hotSwitch[0]).focus();
                return false;
            }
        } catch(e) {
            // Ignore it -- if keyChar is empty the above blows up.
        }

        // Backspace in FireFox
        if (keyCode == 8) {
            return true;
        }

        // keyCode 13 is the Enter key
        if (keyCode == 13 && (this.element.value != "" || this.lastCache != undefined)) {
            // Pull from the lastCache if our value is empty.
            var value = this.element.value != "" ? this.element.value : this.lastCache;

            // Don't let an empty string through.
            if (value == "") {
                return false;
            }

            this._roll_and_update(value);
            return false;
        } else if (keyChar == 'c' && this.element.value == "" && this.lastResponse != undefined) {
            // Character point
            $(this.element).parent().find(".resultsTable tbody tr:first").remove()
            this.characterPoint();
            this.addRow(this.lastResponse);
        } else if ((keyChar == '*' || keyChar == '=') && this.element.value == "") {
            // Clear the list
            $(this.element).parent().find(".resultsTable").find('tbody').empty();
            this.lastCache = undefined;
            this.lastResponse = undefined;
        } else if (keyChar == '-' && this.element.value == "" && this.lastCache != undefined) {
            // Parse our last entry, and reduce our number of dice by 1
            var match = reValid.exec(this.lastCache);
            var dice = parseInt(match[1]) - 1;
            var pips = match[2] === undefined ? 0 : parseInt(match[2]);
            var value = "" + dice + "+" + pips;

            // Don't do anythign if we would be down at 0D.
            if (dice == 0) {
                return false;
            }

            this._roll_and_update(value);
            return false;
        }

        var newvalue = this.element.value + keyChar;
        return reValid.test(newvalue);
    }
}

$(".dieInput").each(function(index) {
    var roller = new Roller( $(this)[0] );

    $(this).keypress(function(e) { 
        return roller.keypressMethod(e);
    });
});
