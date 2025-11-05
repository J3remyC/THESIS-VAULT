import { PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js"
import { mailtrapClient, sender } from "./mailtrap.js"

export const sendVerificationEmail = async (email, verificationToken) => {
    const recipient = [{email}]

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Verifiy your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email Verification"
        })

        console.log("Email sent succesfully", response);
    } catch (error) {
        console.log("Error sending verification", error);
        throw new Error(`Error sending verification email: ${error}`);
    }
}

export const sendWelcomeEmail = async (email, name) => {
    const recipient = [{email}];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to:  recipient,
            template_uuid: "7b4a2529-bc83-4365-8fc2-1e6758c5cd78",
            template_variables: {
            "company_info_name": "Auth Company",
            "name": name
            }
        });

        console.log("Welcome email sent succesfully", response);
    } catch (error) {
        console.log("Error sending welcome email", error);
        throw new Error(`Error sending welcome email ${error}`);
    }
}

export const sendPasswordResetEmail = async (email, resetURL) =>{
    const recipient = [{ email }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Reset your password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
            category: "Password reset"
        })
    } catch (error) {
        throw new Error(`Error sending password reset email: ${error}`)
    }
}

export const sendResetSuccessEmail = async (email) => {
    const recipient = [{email}];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Password reset successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset"
        });

        console.log("Password reset email sent succesfully", response)
    } catch (error) {
        console.log("Error sending password reset succes email", error)
    }
}