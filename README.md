# Find A Pump Project

Documentation folder will contain all of our documents for the project.

### Technical overview and introduction to the project:

- The find-a-pump-code folder has all the code contained in it
- `cd find-a-pump-code` then `npm install` then `npm run dev` will start the project locally
- This is a mono-repo project with a separated frontend/backend apps. When you run `npm run dev` in the find-a-pump-code folder you will start both front and backend to run at the same time using a package called Turbo.
- The frontend is Nextjs and styling with Tailwind (we can talk about if we keep that styling or we do our own css)
- React components are kept in frontend/app/components
- The backend has industry-standard separation between routes -> controllers -> services to keep all the logic properly separated
- We can interact with the sqlite database using the ORM Prisma. This was in my base project (is also standard to use an ORM) but we can also use normal sql as well
