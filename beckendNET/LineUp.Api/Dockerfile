FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["LineUp.Api.csproj", "./"]
RUN dotnet restore "LineUp.Api.csproj"

COPY . .
RUN dotnet publish "LineUp.Api.csproj" --configuration Release --output /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "LineUp.Api.dll"]
