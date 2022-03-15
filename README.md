# Usecase eCommerce user Registration and Login :
1.	Have a login screen and register screen for new users to register.
a.	In the registration screen, get email, first name, last name , profile image , Employee Id
(The register screen grabs an email, firstName, lastName, [optional] employeeId, and profilePic image)
b.	When registering the user should be put into a AWS cognito Pool based on where he enter employee id or not.
(A pool for employees and nonemployees each has been created alongside a backend function to send a confirmation code for Cognito User pool accounts. A validation method for email domains and employee IDs is in development)
2.	the profile image should be stored in s3.
(Currently, the register backend function saves a corrupted file to the S3 bucket albeit with a valid URL in DynamoDB alongside an appropriate bucket key)
3.	Show a login screen which upon login should validate which cognito pool the user belongs too and redirect to different pages.
(The login screen has been tested and confirmed to work with the backend function. The backend function has been tested and confirmed to validate a login with the Cognito User pools via email address)
4.	One Home screen for non-employee user - dont show Presidio logo
(A nonemployee screen exists and is redirected to on a successful nonemployee login and registration attempt)
5.	One Home screen for employee user - show Presidio logo.
(An employee screen exists and is redirected to on a successful employee login and registration attempt. The employee screen successfully retrieves an image of the Presidio logo through Cloudfront using S3)
Use Serverless, s3, CDN, cognito, dynamodb , node JS , react to achieve the above
# Database: DynamoDB Schema
• email: email address (String) to be used for login (frontend) screen and (backend) function, Primary Key\
• firstName: first name (String) given by a user during registration\
• lastName: last name (String) given by a user during registration\
• employeeId: optional identifier (String) to determine employee/non-employee status when the frontend redirects from a successful login to an employee/non-employee Home Screen page\
• password: a password (String) to be obtained during registration for use during the login process\
• profilePic: an S3 bucket key (String) to retrieve the profile picture file from the environment bucket\
# Storage: S3 Buckets/Folders (eCommerce-sample-backend-dev)
## Page Files Folder (common)
•	A folder containing a Presidio logo file and future necessary images to be loaded on Home screen pages\
## Profile Pictures Folder (photos)
•	A folder containing profile pictures that were uploaded during the user registration process\
# Backend: Lambda Functions
## Register (POST)
1.	Read multiform data from an API request that includes an email address, first name, last name, password, and profile image
a.	An employee id can be included or excluded to signify whether a user is an employee or non-employee
2.	Upload the image to S3 and generate a URL
a. aws-multipart-parser was used for parsing multiform data, with spotText set to true
b. The Lambda function's API Gateway enabled support for 'multipart/form-data' under Settings -> Binary Media Types
3.	Save the email, first name, last name, password, employee id (if entered), and S3 bucket key to a DynamoDB entry
4.	Depending on whether an employee id was entered, add the account to a Cognito User Pool, either for employees or nonemployees
5.	Return a response containing the email, first name, and last name upon success (hide S3 URL, employee id, and password for security purposes) if the function succeeds; return an error response if it fails
## Login (POST)
1.	Read formdata from an API request that contains an email address and password
2.	If the email and password is valid, verify the identity using Cognito User/Identity Pools; if either or both is/are invalid, return an incorrect login response
3.	If Cognito is verified, return a successful login response; otherwise return an authentication error response
## Confirm (GET)
After a successful registration attempt, a verification code is sent to the given email address.
1.	Read form data from an API request that contains an email address, verification code, and employeeId (empty string for non-employees)
2.	If the employeeId string is empty, the verification process for the Cognito User Pool account proceeds for the non-employee pool; if an employeeId value is given, it proceeds to the employee pool
3.	If the email address and code are valid, the Cognito account is confirmed; otherwise return a confirmation error esponse
# Frontend: ReactJS Pages
## Login Page
•	This serves as the homepage, with an email/password form and a link to the Register page underneath\
•	A form takes in an email and password with Cognito implementation\
	-	Submitting the form sends an API request to the Login Backend function\
## Register Page
•	A form takes in an email address, first name, last name, password, and profile image; there is also an option to include an employee id within the form\
	-	Submitting the form sends an API request to the Register Backend function\
	-	useEffect is used to guarantee the profile picture is saved to the setState\
	-	createFormData was called with await to ensure the image file is fully appended to formData\
## Employee Page
•	This page is redirected to after a successful employee account login (from the Login Page)\
•	It will have a Presidio logo image file retrieved from S3/Cloudfront (URL), a profile picture retrieved from S3 (presigned URL) and a logout button underneath (that redirects to the Login Page)\
## Non-Employee Page
•	This page is redirected to after a successful non-employee account login (from the Login Page)\
•	It will have a profile picture retrieved from S3 (presigned URL) and a logout button underneath (that redirects to the Login Page)\
