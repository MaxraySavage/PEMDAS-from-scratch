const evaluationTiers = [
  { operators: ['**'], leftAssociative: false },
  { operators: ['*', '/'], leftAssociative: true },
  { operators: ['+', '-'], leftAssociative: true },
];

function evalOperation(operandOne, operator, operandTwo) {
  switch (operator) {
    case '**':
      return operandOne ** operandTwo;

    case '*':
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
  if (tier.leftAssociative) {
    return expression.findIndex((o) => tier.operators.includes(o));
  }
  /*
    If the operator is right associative we find the first instance of the operator
    We then look to see if that operator is the first of a sequence of operators in the tier
    If so, we jump forward until we get to the last operator in the sequence
    For example with '2 ** 3 ** 1 + 1 ** 2' we should get the second **
  */
  let nextOperatorIndex = expression.findIndex((o) => tier.operators.includes(o));
  while (nextOperatorIndex + 2 < expression.length
    && tier.operators.includes(expression[nextOperatorIndex + 2])) {
    nextOperatorIndex += 2;
  }
  return nextOperatorIndex;
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
  return 'Error: no closing parentheses found';
}

function evaluateExpression(expressionArray) {
  const expression = [...expressionArray];
  let openingParenthesesIndex = expression.findIndex((o) => o === '(');
  while (openingParenthesesIndex !== -1) {
    const closingParenthesesIndex = findClosingParenthesesIndex(
      expression,
      openingParenthesesIndex,
    );
    const subexpression = expression.slice(
      openingParenthesesIndex + 1,
      closingParenthesesIndex,
    );
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
      const result = evalOperation(
        ...expression.slice(nextOperatorIndex - 1, nextOperatorIndex + 2)
      );
      expression.splice(nextOperatorIndex - 1, 3, result);
      nextOperatorIndex = getNextOperatorIndex(expression, tier);
    }
  });
  return expression[0];
}

function parseExpression(expressionString) {
  const expressionArray = Array.from(
    expressionString.matchAll(
      /-?[0-9]+\.?[0-9]*|\*{2}|\*{1}|\/|\+|-|\(|\)/g
    )
  ).map((v) => v[0]);
  return expressionArray.map((term) => {
    if (Number.isNaN(parseFloat(term))) {
      return term;
    }
    return parseFloat(term);
  });
}
