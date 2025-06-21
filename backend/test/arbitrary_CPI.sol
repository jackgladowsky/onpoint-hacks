   pub fn withdraw(accounts: &[AccountInfo], amount: u64) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let token_program = next_account_info(account_info_iter)?;
        let pool = next_account_info(account_info_iter)?;
        let pool_auth = next_account_info(account_info_iter)?;
        let destination = next_account_info(account_info_iter)?;
        invoke(
            &spl_token::instruction::transfer(
                &token_program.key,
                &pool.key,
                &destination.key,
                &pool_auth.key,
                &[],
                amount,
            )?,
            &[
                &pool.clone(),
                &destination.clone(),
                &pool_auth.clone(),
            ],
        )
    }