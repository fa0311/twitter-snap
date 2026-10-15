@echo off

node --import tsx --disable-warning=ExperimentalWarning "%~dp0\dev" %*
