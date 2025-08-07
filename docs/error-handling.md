# Error Handling Documentation

## Overview

This document describes the error handling approach implemented in the BotAlbion project. The goal is to provide consistent error handling across all commands, with proper logging and user-friendly error messages.

## Error Handling Utility

The error handling utility is located in `src/utils/errorHandler.ts`. It provides the following features:

- Typed error categories
- Consistent error logging
- User-friendly error messages
- Support for different interaction states (replied, deferred)
- Command execution wrapping for automatic error handling

## Error Types

The following error types are defined:

| Error Type | Description | User Message |
|------------|-------------|--------------|
| API_ERROR | Errors from the Albion Online API | "Impossible de récupérer les données de l'API Albion. Veuillez réessayer plus tard." |
| TIMEOUT_ERROR | Request timeout errors | "La requête a pris trop de temps. Veuillez réessayer plus tard." |
| NOT_FOUND_ERROR | Resource not found errors | "Aucun résultat trouvé. Vérifiez l'orthographe et réessayez." |
| VALIDATION_ERROR | Input validation errors | "Les données fournies sont invalides." |
| PERMISSION_ERROR | Permission-related errors | "Vous n'avez pas les permissions nécessaires pour cette action." |
| INTERNAL_ERROR | Unexpected internal errors | "Une erreur s'est produite lors de l'exécution de la commande." |

## Usage

### Basic Error Handling

To handle errors in a command:

```typescript
import { handleCommandError } from "../utils/errorHandler.js";

try {
  // Command logic
} catch (error) {
  await handleCommandError(error, interaction, "commandName", {
    // Additional metadata for logging
  });
}
```

### Creating Typed Errors

To create a typed error:

```typescript
import { createError, ErrorType } from "../utils/errorHandler.js";

throw createError("No player found with name: PlayerName", ErrorType.NOT_FOUND_ERROR);
```

### Wrapping Command Execution

The recommended approach is to wrap the command execution function:

```typescript
import { withErrorHandling } from "../utils/errorHandler.js";

async function executeCommand(interaction: ChatInputCommandInteraction) {
  // Command logic
}

// Wrap the command execution with error handling
export const execute = withErrorHandling(executeCommand, "commandName");
```

## Implementation in Commands

All commands have been updated to use the error handling utility:

1. **playerstats.ts**: Uses the withErrorHandling wrapper for consistent error handling
2. **guild.ts**: Uses the withErrorHandling wrapper and throws typed errors
3. **death.ts**: Refactored to use the withErrorHandling wrapper and proper logging
4. **kill.ts**: Refactored to use the withErrorHandling wrapper and proper logging
5. **playerhistory.ts**: Uses the withErrorHandling wrapper and includes error handling for button interactions

## Testing

A test script is available at `test-error-handling.js` to verify the error handling implementation. It simulates different error scenarios and tests how the error handling utility responds to each one.

## Benefits

- **Consistency**: All commands handle errors in the same way
- **Maintainability**: Error handling logic is centralized
- **User Experience**: User-friendly error messages
- **Debugging**: Detailed error logging with metadata
- **Robustness**: Proper handling of different interaction states

## Future Improvements

- Add more specific error types as needed
- Implement localization for error messages
- Add retry mechanisms for transient errors
- Implement error tracking and reporting