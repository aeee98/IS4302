# IS4302 Election Project Notes

The main test file is `PortalTest.js`. Some key points of note before running truffle test on this environment. 

1) Ensure that test-helpers are installed. `pip install --save-dev @openzeppelin/test-helpers`
2) Ensure that it is a fresh Ganache environment. The test cases relies on blockchain time manipulation in order for test results to be set correctly. You can do so by pressing Switch and then QuickStart on a fresh instance.
3) If it fails, repeat step 2. The test case may fail if the tests resolve too quickly and the time library did not complete before the next step.
