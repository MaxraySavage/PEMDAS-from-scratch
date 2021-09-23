const evaluationTiers = [
  { operators: ['**'], leftAssociative: false },
  { operators: ['x', '/'], leftAssociative: true },
  { operators: ['+', '-'], leftAssociative: true },
];

function evalOperation(operandOne, operator, operandTwo) {
  switch (operator) {
    case '**':
      return operandOne ** operandTwo;

    case 'x':
      return operandOne * operandTwo;

    case '/':
      return operandOne / operandTwo;

    case '+':
      return operandOne + operandTwo;

    case '-':
      return operandOne - operandTwo;

    default:
      return 'Error, invalid operator';
  }
}

function getNextOperatorIndex(expression, tier) {
  let nextOperatorIndex = expression.findIndex((o) => tier.operators.includes(o));
  // If the operator is left associative or not found at all, we're done
  if (tier.leftAssociative || nextOperatorIndex === -1) {
    return nextOperatorIndex;
  }
  /*
    If the operator is right associative
    we must see if that operator is the first of a sequence of operators within the tier
    If so, we jump forward until we get to the last operator in the sequence
    For example with '2 ** 3 ** 1 + 1 ** 2' we should get the second **
  */
  while (nextOperatorIndex + 2 < expression.length
    && tier.operators.includes(expression[nextOperatorIndex + 2])) {
    nextOperatorIndex += 2;
  }
  return nextOperatorIndex;
}

function performOperation(expression, index) {
  const result = evalOperation(
    ...expression.slice(index - 1, index + 2)
  );
  expression.splice(index - 1, 3, result);
}

function findClosingParenthesesIndex(expression, openingParenthesesIndex) {
  let parenthesesDepth = 1;
  for (let i = openingParenthesesIndex + 1; i < expression.length; i += 1) {
    if (expression[i] === '(') {
      parenthesesDepth += 1;
    } else if (expression[i] === ')') {
      parenthesesDepth -= 1;
      if (parenthesesDepth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function getSubexpression(expression, openingParenthesesIndex) {
  const closingParenthesesIndex = findClosingParenthesesIndex(
    expression,
    openingParenthesesIndex,
  );
  const subexpression = expression.slice(
    openingParenthesesIndex + 1,
    closingParenthesesIndex,
  );
  return subexpression;
}

function evaluateExpression(expressionArray) {
  const expression = [...expressionArray];
  let openingParenthesesIndex = expression.findIndex((o) => o === '(');
  while (openingParenthesesIndex !== -1) {
    const subexpression = getSubexpression(expression, openingParenthesesIndex);
    // recurse into subexpression
    const subexpressionResult = evaluateExpression(subexpression);
    // we need to add two to length
    // because subexpression doesn't include its bounding parentheses
    expression.splice(
      openingParenthesesIndex,
      subexpression.length + 2,
      subexpressionResult,
    );
    openingParenthesesIndex = expression.findIndex((o) => o === '(');
  }
  evaluationTiers.forEach((tier) => {
    let nextOperatorIndex = getNextOperatorIndex(expression, tier);
    while (nextOperatorIndex !== -1) {
      performOperation(expression, nextOperatorIndex);
      nextOperatorIndex = getNextOperatorIndex(expression, tier);
    }
  });
  return expression[0];
}

function parseExpressionString(expressionString) {
  const expressionArray = Array.from(
    expressionString.matchAll(
      /-?[0-9]+\.?[0-9]*|\*{2}|x{1}|\/|\+|-|\(|\)/g
    )
  ).map((v) => v[0]);
  return expressionArray.map((term) => {
    if (Number.isNaN(parseFloat(term))) {
      return term;
    }
    return parseFloat(term);
  });
}

function buildExpressionHTML(
  expressionArray,
  subexpressionStart,
  subexpressionEnd,
  currentOperator = -1,
  currentOperands = -1,
) {
  let expression = [...expressionArray];
  expression.splice(subexpressionEnd, 0, '</span>');
  expression.splice(subexpressionStart, 0, '<span class="subexpression">');
  return expression.join(' ');
}

window.addEventListener('load', () => {
  const stepForwardButton = document.getElementsByClassName('step-forward')[0];
  const expressionDiv = document.getElementsByClassName('problem-display')[0];

  let expression = parseExpressionString('12 / 4 x (( 2 - 2) + 8 ** (2 +4))');
  let subexpressionStart = 0;
  let subexpressionEnd = expression.length;
  let expressionHTML = buildExpressionHTML(expression, subexpressionStart, subexpressionEnd);
  let currentTier = 0;

  expressionDiv.innerHTML = expressionHTML;
  stepForwardButton.addEventListener('click', () => {
    if (expression.length === 1) {
      return
    }
    // Look within subexpression for parentheses
    const subexpression = expression.slice(subexpressionStart, subexpressionEnd);
    let firstSubexpressionParentheses = subexpression.slice(1).findIndex((o) => o === '(');
    // If so, update subexpression numbers
    if (firstSubexpressionParentheses !== -1) {
      subexpressionStart += 1 + firstSubexpressionParentheses;
    } else {
      let nextOperatorIndex = getNextOperatorIndex(subexpression, evaluationTiers[currentTier]);
      while (nextOperatorIndex === -1 && currentTier < 2) {
        currentTier += 1;
        nextOperatorIndex = getNextOperatorIndex(subexpression, evaluationTiers[currentTier]);
      }
      if (nextOperatorIndex !== -1) {
        performOperation(expression, nextOperatorIndex + subexpressionStart);
      } else {
        expression.splice(
          subexpressionStart,
          subexpression.length,
          subexpression[1],
        );
        while(subexpressionStart > 0 && expression[subexpressionStart] !== '(') {
          subexpressionStart -= 1;
        }
        currentTier = 0;
      }
    }
    // If not, determine what the next operation is
    console.log(subexpressionStart, subexpressionEnd);
    subexpressionEnd = findClosingParenthesesIndex(expression, subexpressionStart) + 1;
    if(subexpressionEnd === 0) {
      subexpressionEnd = expression.length;
    }
    console.log(subexpressionStart, subexpressionEnd)
    expressionDiv.innerHTML = buildExpressionHTML(expression, subexpressionStart, subexpressionEnd);
  });
});
