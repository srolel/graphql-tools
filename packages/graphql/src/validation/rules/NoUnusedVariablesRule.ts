import { GraphQLError } from '../../error/GraphQLError.js';

import type { VariableDefinitionNode } from '../../language/ast.js';
import type { ASTVisitor } from '../../language/visitor.js';

import type { ValidationContext } from '../ValidationContext.js';

/**
 * No unused variables
 *
 * A GraphQL operation is only valid if all variables defined by an operation
 * are used, either directly or within a spread fragment.
 *
 * See https://spec.graphql.org/draft/#sec-All-Variables-Used
 */
export function NoUnusedVariablesRule(context: ValidationContext): ASTVisitor {
  let variableDefs: Array<VariableDefinitionNode> = [];

  return {
    OperationDefinition: {
      enter() {
        variableDefs = [];
      },
      leave(operation) {
        const variableNameUsed = Object.create(null);
        const usages = context.getRecursiveVariableUsages(operation);

        for (const { node } of usages) {
          variableNameUsed[node.name.value] = true;
        }

        for (const variableDef of variableDefs) {
          const variableName = variableDef.variable.name.value;
          if (variableNameUsed[variableName] !== true) {
            context.reportError(
              new GraphQLError(
                operation.name
                  ? `Variable "$${variableName}" is never used in operation "${operation.name.value}".`
                  : `Variable "$${variableName}" is never used.`,
                { nodes: variableDef }
              )
            );
          }
        }
      },
    },
    VariableDefinition(def) {
      variableDefs.push(def);
    },
  };
}
