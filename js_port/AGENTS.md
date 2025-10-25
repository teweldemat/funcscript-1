# FuncScript JavaScript Port

This folder contains the JavaScript port of the **.NET FuncScript interpreter**.  
Because type information is critical for internal implementations of FuncScript functions, all values in the JavaScript port are represented as a tuple of **(type number, value)**.  
This approach ensures reliable compatibility with the original .NET implementations.